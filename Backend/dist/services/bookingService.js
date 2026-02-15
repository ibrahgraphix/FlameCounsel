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
        return bookingRepository_1.bookingRepository.updateBookingStatus(bookingId, status);
    },
    async rescheduleBooking(bookingId, bookingDate, bookingTime) {
        return bookingRepository_1.bookingRepository.rescheduleBooking(bookingId, bookingDate, bookingTime);
    },
};
exports.default = exports.bookingService;
