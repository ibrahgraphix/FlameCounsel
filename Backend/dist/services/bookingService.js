"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = void 0;
// src/services/bookingService.ts
const db_1 = __importDefault(require("../config/db"));
const studentRepository_1 = require("../repositories/studentRepository");
const bookingRepository_1 = require("../repositories/bookingRepository");
const googleCalendarService_1 = __importDefault(require("../services/googleCalendarService"));
exports.bookingService = {
    async createBooking({ student_name, student_email, counselor_id, booking_date, booking_time, year_level, additional_notes, }) {
        const client = await db_1.default.connect();
        try {
            await client.query("BEGIN");
            // assume studentRepository has methods that accept client for transactional consistency
            let student = await studentRepository_1.studentRepository.findByEmail(student_email, client);
            if (!student) {
                // create returns the created student row { student_id, name, email, ... }
                student = await studentRepository_1.studentRepository.create(student_name ?? null, student_email, client);
            }
            const booking = await bookingRepository_1.bookingRepository.createBooking(student.student_id, Number(counselor_id), booking_date, booking_time, year_level ?? null, additional_notes ?? null, client);
            await client.query("COMMIT");
            return booking;
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    },
    async getBookingsByStudentEmail(email) {
        return bookingRepository_1.bookingRepository.getBookingsByStudentEmail(email);
    },
    async getBookingsByCounselorId(counselorId) {
        return bookingRepository_1.bookingRepository.getBookingsByCounselorId(counselorId);
    },
    async getAllBookings() {
        return bookingRepository_1.bookingRepository.getAllBookings();
    },
    async updateBookingStatus(bookingId, status) {
        console.log(`[BookingService] Updating status for booking ${bookingId} to ${status}`);
        const updated = await bookingRepository_1.bookingRepository.updateBookingStatus(bookingId, status);
        if (!updated) {
            console.warn(`[BookingService] Booking ${bookingId} not found for status update.`);
            return null;
        }
        // If canceled, try to remove from Google Calendar
        const isCanceled = status === "canceled" || status === "cancelled";
        if (isCanceled) {
            console.log(`[BookingService] Booking ${bookingId} canceled. Checking for Google Calendar event...`);
            if (updated.google_event_id && updated.counselor_id) {
                console.log(`[BookingService] Found google_event_id: ${updated.google_event_id}. Attempting deletion for counselor: ${updated.counselor_id}`);
                try {
                    const result = await googleCalendarService_1.default.deleteEvent(updated.counselor_id, updated.google_event_id);
                    if (result && result.success) {
                        console.log(`[BookingService] Successfully deleted Google Calendar event for booking ${bookingId}`);
                    }
                    else {
                        console.error(`[BookingService] Google Calendar event deletion reported failure:`, result?.error);
                    }
                }
                catch (err) {
                    console.error("[BookingService] Failed to delete Google Calendar event for booking", bookingId, err);
                }
            }
            else {
                console.warn(`[BookingService] Cannot delete Google Calendar event: google_event_id (${updated.google_event_id}) or counselor_id (${updated.counselor_id}) missing.`);
            }
        }
        return updated;
    },
    async rescheduleBooking(bookingId, bookingDate, bookingTime) {
        return bookingRepository_1.bookingRepository.rescheduleBooking(bookingId, bookingDate, bookingTime);
    },
};
exports.default = exports.bookingService;
