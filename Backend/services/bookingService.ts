// src/services/bookingService.ts
import pool from "../config/db";
import { studentRepository } from "../repositories/studentRepository";
import { bookingRepository } from "../repositories/bookingRepository";
import { BookingRow } from "../models/Booking";
import GoogleCalendarService from "../services/googleCalendarService";
// @ts-ignore
import { DateTime } from "luxon";

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";

export const bookingService = {
  async createBooking({
    student_name,
    student_email,
    counselor_id,
    booking_date,
    booking_time,
    year_level,
    additional_notes,
  }: {
    student_name?: string | null;
    student_email: string;
    counselor_id: number;
    booking_date: string;
    booking_time: string;
    year_level?: string | null;
    additional_notes?: string | null;
  }): Promise<BookingRow> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let student = await studentRepository.findByEmail(student_email, client);
      if (!student) {
        student = await studentRepository.create(
          student_name ?? null,
          student_email,
          client
        );
      }

      const booking = await bookingRepository.createBooking(
        student.student_id,
        Number(counselor_id),
        booking_date,
        booking_time,
        year_level ?? null,
        additional_notes ?? null,
        client
      );

      await client.query("COMMIT");
      return booking;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async getBookingsByStudentEmail(email: string) {
    return bookingRepository.getBookingsByStudentEmail(email);
  },

  async getBookingsByCounselorId(counselorId: number) {
    return bookingRepository.getBookingsByCounselorId(counselorId);
  },

  async getAllBookings() {
    return bookingRepository.getAllBookings();
  },

  async updateBookingStatus(bookingId: string | number, status: string) {
    console.log(`[BookingService] Updating status for booking ${bookingId} to ${status}`);
    const updated = await bookingRepository.updateBookingStatus(
      bookingId,
      status
    );

    if (!updated) {
      console.warn(`[BookingService] Booking ${bookingId} not found for status update.`);
      return null;
    }

    // When counselor CONFIRMS, create the Google Calendar event (best-effort)
    if (status === "confirmed") {
      console.log(`[BookingService] Booking ${bookingId} confirmed. Creating Google Calendar event...`);
      try {
        const result = await GoogleCalendarService.createCalendarEventForBooking(bookingId);
        if (result && result.success) {
          console.log(`[BookingService] Google Calendar event created for booking ${bookingId}: ${result.googleEvent?.id}`);
          // Return the refreshed row so the response includes the google_event_id
          const refreshed = await bookingRepository.getBookingById(bookingId);
          return refreshed ?? updated;
        } else {
          console.warn(
            `[BookingService] Google Calendar event creation skipped/failed for booking ${bookingId}:`,
            result?.reason,
            result?.error
          );
        }
      } catch (err) {
        // Non-fatal: booking is already confirmed in DB; calendar creation is best-effort
        console.error("[BookingService] Failed to create Google Calendar event on confirm:", err);
      }
    }

    // When CANCELED, remove from Google Calendar if an event exists
    const isCanceled = status === "canceled" || status === "cancelled";
    if (isCanceled) {
      console.log(`[BookingService] Booking ${bookingId} canceled. Checking for Google Calendar event...`);
      if (updated.google_event_id && updated.counselor_id) {
        try {
          const result = await GoogleCalendarService.deleteEvent(
            updated.counselor_id,
            updated.google_event_id
          );
          if (result && result.success) {
            console.log(`[BookingService] Successfully deleted Google Calendar event for booking ${bookingId}`);
          } else {
            console.error(`[BookingService] Google Calendar event deletion reported failure:`, result?.error);
          }
        } catch (err) {
          console.error(
            "[BookingService] Failed to delete Google Calendar event for booking",
            bookingId,
            err
          );
        }
      } else {
        console.warn(
          `[BookingService] Cannot delete Google Calendar event: google_event_id (${updated.google_event_id}) or counselor_id (${updated.counselor_id}) missing.`
        );
      }
    }

    return updated;
  },

  async rescheduleBooking(
    bookingId: string | number,
    bookingDate: string,
    bookingTime: string
  ) {
    return bookingRepository.rescheduleBooking(
      bookingId,
      bookingDate,
      bookingTime
    );
  },

  /**
   * closePendingExpiredBookings — scans all bookings with status='pending'
   * and marks them 'closed' if the appointment time has already passed.
   * Runs on startup and then every 5 minutes via the scheduler in server.ts.
   * Counselors cannot act on closed bookings.
   */
  async closePendingExpiredBookings(): Promise<number> {
    const pendingBookings = await bookingRepository.getPendingBookings();
    const now = DateTime.now();
    let closedCount = 0;

    for (const booking of pendingBookings) {
      try {
        const tz = booking.counselor_timezone ?? DEFAULT_TIMEZONE;
        const dateStr =
          typeof booking.booking_date === "object"
            ? (booking.booking_date as Date).toISOString().slice(0, 10)
            : String(booking.booking_date ?? "");
        const timeStr = String(booking.booking_time ?? "00:00:00").slice(0, 8);

        if (!dateStr) continue;

        const [year, month, day] = dateStr.split("-").map(Number);
        const [hour, minute, second] = timeStr.split(":").map(Number);

        const bookingDT = DateTime.fromObject(
          {
            year,
            month,
            day,
            hour: hour || 0,
            minute: minute || 0,
            second: second || 0,
          },
          { zone: tz }
        );

        if (!bookingDT.isValid) continue;

        if (bookingDT < now) {
          await bookingRepository.updateBookingStatus(booking.booking_id, "closed");
          console.log(
            `[BookingService] Auto-closed expired pending booking ${booking.booking_id} (slot was ${dateStr} ${timeStr})`
          );
          closedCount++;
        }
      } catch (err) {
        console.error(
          `[BookingService] Error checking expiry for booking ${booking.booking_id}:`,
          err
        );
      }
    }

    if (closedCount > 0) {
      console.log(`[BookingService] Auto-closed ${closedCount} expired pending booking(s).`);
    }

    return closedCount;
  },
};

export default bookingService;
