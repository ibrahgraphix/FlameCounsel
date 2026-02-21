"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRepository = void 0;
// src/repositories/bookingRepository.ts
const db_1 = __importDefault(require("../config/db"));
exports.bookingRepository = {
    async createBooking(studentId, counselorId, bookingDate, bookingTime, yearLevel, additionalNotes, client) {
        const q = `INSERT INTO bookings
       (student_id, counselor_id, booking_date, booking_time, year_level, additional_notes, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'pending', NOW(), NOW())
       RETURNING booking_id, student_id, counselor_id, booking_date, booking_time, year_level, additional_notes, status, created_at, updated_at, google_event_id`;
        const params = [
            // allow null for guest bookings
            studentId,
            counselorId,
            bookingDate,
            bookingTime,
            yearLevel ?? null,
            additionalNotes ?? null,
        ];
        const res = client
            ? await client.query(q, params)
            : await db_1.default.query(q, params);
        return res.rows[0];
    },
    async getBookingsByStudentEmail(email) {
        const res = await db_1.default.query(`SELECT b.booking_id, b.student_id, b.counselor_id, b.booking_date, b.booking_time,
              b.year_level, b.additional_notes, b.status, b.created_at, b.updated_at, b.google_event_id,
              c.counselor_id AS c_counselor_id, c.name as counselor_name, c.email as counselor_email,
              s.student_id AS s_student_id, s.name AS student_name, s.email AS student_email
       FROM bookings b
       JOIN students s ON b.student_id = s.student_id
       LEFT JOIN counselors c ON b.counselor_id = c.counselor_id
       WHERE lower(s.email) = lower($1)
       ORDER BY b.booking_date DESC, b.booking_time DESC`, [email]);
        return res.rows;
    },
    async getBookingsByCounselorId(counselorId) {
        const res = await db_1.default.query(`SELECT b.booking_id, b.student_id, b.counselor_id, b.booking_date, b.booking_time,
              b.year_level, b.additional_notes, b.status, b.created_at, b.updated_at, b.google_event_id,
              s.student_id AS s_student_id, s.name AS student_name, s.email AS student_email
       FROM bookings b
       JOIN students s ON b.student_id = s.student_id
       WHERE b.counselor_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`, [counselorId]);
        return res.rows;
    },
    async getAllBookings() {
        const res = await db_1.default.query(`SELECT b.booking_id, b.student_id, b.counselor_id, b.booking_date, b.booking_time,
              b.year_level, b.additional_notes, b.status, b.created_at, b.updated_at, b.google_event_id,
              s.student_id AS s_student_id, s.name AS student_name, s.email AS student_email,
              c.counselor_id AS c_counselor_id, c.name AS counselor_name, c.email AS counselor_email
       FROM bookings b
       LEFT JOIN students s ON b.student_id = s.student_id
       LEFT JOIN counselors c ON b.counselor_id = c.counselor_id
       ORDER BY b.created_at DESC`);
        return res.rows;
    },
    async updateBookingStatus(bookingId, status) {
        if (!status || typeof status !== "string") {
            const e = new Error("Invalid status");
            e.code = "INVALID_INPUT";
            throw e;
        }
        const q = `UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_id = $2 RETURNING booking_id, student_id, counselor_id, booking_date, booking_time, year_level, additional_notes, status, created_at, updated_at, google_event_id`;
        try {
            const res = await db_1.default.query(q, [status, bookingId]);
            if (!res.rows || res.rows.length === 0)
                return null;
            return res.rows[0];
        }
        catch (err) {
            console.error("bookingRepository.updateBookingStatus error:", err);
            throw err;
        }
    },
    async rescheduleBooking(bookingId, bookingDate, bookingTime) {
        const res = await db_1.default.query(`UPDATE bookings
       SET booking_date = $1, booking_time = $2, updated_at = NOW()
       WHERE booking_id = $3
       RETURNING booking_id, student_id, counselor_id, booking_date, booking_time, year_level, additional_notes, status, created_at, updated_at, google_event_id`, [bookingDate, bookingTime, bookingId]);
        if (!res.rows || res.rows.length === 0)
            return null;
        return res.rows[0];
    },
    /**
     * Persist google event id to booking row.
     * Returns the updated booking row or null if not found.
     */
    async updateGoogleEventId(bookingId, googleEventId) {
        try {
            const q = `UPDATE bookings
                 SET google_event_id = $1, updated_at = NOW()
                 WHERE booking_id = $2
                 RETURNING booking_id, student_id, counselor_id, booking_date, booking_time, year_level, additional_notes, status, created_at, updated_at, google_event_id`;
            const res = await db_1.default.query(q, [googleEventId, bookingId]);
            if (!res.rows || res.rows.length === 0)
                return null;
            return res.rows[0];
        }
        catch (err) {
            console.error("bookingRepository.updateGoogleEventId error:", err);
            throw err;
        }
    },
};
exports.default = exports.bookingRepository;
