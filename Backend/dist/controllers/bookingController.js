"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const bookingService_1 = __importDefault(require("../services/bookingService"));
const jwt = __importStar(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const jwt_1 = require("../utils/jwt");
const counselorRepository_1 = require("../repositories/counselorRepository");
const bookingRepository_1 = __importDefault(require("../repositories/bookingRepository"));
const googleCalendarService_1 = __importDefault(require("../services/googleCalendarService"));
const emailverificationRepository_1 = require("../repositories/emailverificationRepository");
const mailer_1 = __importDefault(require("../utils/mailer"));
dotenv_1.default.config();
const JWT_SECRET = jwt_1.JWT_SECRET ||
    process.env.JWT_SECRET ||
    "supersecret";
const TOKEN_EXPIRY = process.env.STUDENT_TOKEN_EXPIRY || "3650d";
const normalizeStatus = (s) => {
    if (!s)
        return s;
    const st = s.toString().toLowerCase().trim();
    if (st === "cancelled" || st === "cancel")
        return "canceled";
    if (st === "confirmed" || st === "confirm")
        return "confirmed";
    if (st === "pending")
        return "pending";
    if (st === "complete" || st === "completed")
        return "completed";
    return st;
};
const generateNumericCode = (digits = 6) => {
    const min = 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
};
/**
 * Verification validity windows (milliseconds)
 */
const CODE_EXPIRY_MS = Number(process.env.VERIFICATION_CODE_TTL_MS ?? 5 * 60 * 1000); // default 5 minutes
const VERIFIED_TTL_MS = Number(process.env.VERIFIED_TTL_MS ?? 30 * 60 * 1000); // default 30 minutes after verification
exports.BookingController = {
    // New: POST /api/bookings/send-code
    async sendVerificationCode(req, res) {
        try {
            const { email } = req.body ?? {};
            if (!email)
                return res
                    .status(400)
                    .json({ success: false, error: "email required" });
            const code = generateNumericCode(6);
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);
            // Store code (upsert)
            await emailverificationRepository_1.emailVerificationRepository.upsertCode(String(email), code, expiresAt);
            // Send email (best-effort) — we include a short message
            const subject = "Your verification code";
            const text = `Your verification code is: ${code}\nThis code is valid for ${Math.floor(CODE_EXPIRY_MS / 60000)} minute(s). If you did not request this, ignore this message.`;
            const html = `<p>Your verification code is: <strong>${code}</strong></p><p>This code is valid for ${Math.floor(CODE_EXPIRY_MS / 60000)} minute(s).</p>`;
            let info = null;
            try {
                info = await mailer_1.default.sendMail({
                    to: String(email),
                    subject,
                    text,
                    html,
                });
                if (!info) {
                    console.error("sendVerificationCode: mailer returned null (likely not configured)");
                    return res.status(500).json({
                        success: false,
                        error: "Failed to send verification code. Please check your email settings and try again.",
                    });
                }
            }
            catch (err) {
                console.error("sendVerificationCode: mailer.sendMail failed:", err);
                return res.status(500).json({
                    success: false,
                    error: "Failed to send verification code. Please try again.",
                });
            }
            return res.json({ success: true, message: "Verification code sent" });
        }
        catch (err) {
            console.error("sendVerificationCode error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    // New: POST /api/bookings/verify-code
    async verifyVerificationCode(req, res) {
        try {
            const { email, code } = req.body ?? {};
            if (!email || !code)
                return res
                    .status(400)
                    .json({ success: false, error: "email and code required" });
            const row = await emailverificationRepository_1.emailVerificationRepository.getByEmail(String(email));
            if (!row)
                return res.status(400).json({
                    success: false,
                    error: "No verification code found for this email",
                });
            if (!row.code || !row.expires_at) {
                return res
                    .status(400)
                    .json({ success: false, error: "No pending code for this email" });
            }
            const now = new Date();
            const expiresAt = new Date(row.expires_at);
            if (expiresAt < now) {
                return res.status(400).json({ success: false, error: "Code expired" });
            }
            if (String(row.code) !== String(code).trim()) {
                return res
                    .status(400)
                    .json({ success: false, error: "Incorrect code" });
            }
            // mark verified
            const updated = await emailverificationRepository_1.emailVerificationRepository.markVerified(String(email));
            return res.json({
                success: true,
                message: "Email verified",
                verified: !!updated,
            });
        }
        catch (err) {
            console.error("verifyVerificationCode error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    // Public: student books (guest) — createBooking is unchanged except it now checks verification
    async createBooking(req, res) {
        try {
            const { student_name, student_email, counselor_id, booking_date, booking_time, year_level, additional_notes, } = req.body;
            if (!student_email || !counselor_id || !booking_date || !booking_time) {
                return res.status(400).json({
                    error: "Missing required fields (student_email, counselor_id, booking_date, booking_time)",
                });
            }
            // CHECK: email verification required
            // We require that the student email has a verification row with verified=true and
            // verified_at is recent (within VERIFIED_TTL_MS). This prevents bypass.
            const ev = await emailverificationRepository_1.emailVerificationRepository.getByEmail(String(student_email));
            if (!ev || !ev.verified || !ev.verified_at) {
                return res.status(401).json({
                    success: false,
                    error: "Email not verified. Please request and verify the code first.",
                });
            }
            const verifiedAt = new Date(ev.verified_at);
            const now = new Date();
            if (now.getTime() - verifiedAt.getTime() > VERIFIED_TTL_MS) {
                return res.status(401).json({
                    success: false,
                    error: "Verification expired. Request a fresh code.",
                });
            }
            // persist booking (existing logic)
            const booking = await bookingService_1.default.createBooking({
                student_name: student_name ?? null,
                student_email: String(student_email),
                counselor_id: Number(counselor_id),
                booking_date: String(booking_date),
                booking_time: String(booking_time),
                year_level: year_level ?? null,
                additional_notes: additional_notes ?? null,
            });
            // Issue long lived token for student's email (guest flow)
            const accessToken = jwt.sign({ email: String(student_email) }, JWT_SECRET, {
                expiresIn: TOKEN_EXPIRY,
            });
            // Try to get counselor info
            let counselor = null;
            try {
                counselor = await (0, counselorRepository_1.getCounselorById)(Number(counselor_id));
            }
            catch (err) {
                console.warn("Could not lookup counselor:", err);
                counselor = null;
            }
            const responseBody = {
                success: true,
                booking,
                access_token: accessToken,
                googleCalendarEvent: null,
                googleCalendarError: null,
                counselor: counselor ?? null,
            };
            // OPTIONAL: remove verification row for this email to force fresh verification next time
            try {
                await emailverificationRepository_1.emailVerificationRepository.deleteByEmail(String(student_email));
            }
            catch (err) {
                // non-fatal
                console.warn("Could not delete verification row after booking:", err);
            }
            return res.status(201).json(responseBody);
        }
        catch (err) {
            console.error("createBooking error:", err);
            return res
                .status(500)
                .json({ success: false, error: err.message || "Server error" });
        }
    },
    // Protected student view (POST with token)
    async getStudentBookingsProtected(req, res) {
        try {
            const { student_email, access_token } = req.body;
            if (!student_email)
                return res.status(400).json({ error: "student_email required" });
            if (!access_token)
                return res.status(401).json({ error: "access_token required" });
            let decoded = null;
            try {
                decoded = jwt.verify(access_token, JWT_SECRET);
            }
            catch (err) {
                return res
                    .status(403)
                    .json({ error: "Invalid or expired access token" });
            }
            if (!decoded || decoded.email !== String(student_email)) {
                return res
                    .status(403)
                    .json({ error: "Token does not match provided email" });
            }
            const bookings = await bookingService_1.default.getBookingsByStudentEmail(String(student_email));
            return res.json({ success: true, bookings });
        }
        catch (err) {
            console.error("getStudentBookingsProtected error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    // Deprecated direct GET (reject)
    async getStudentBookingsDeprecated(_req, res) {
        return res.status(400).json({
            error: "Unprotected student lookups are disabled. Use POST /api/bookings/student/view with { student_email, access_token }.",
        });
    },
    // Counselor view: Return bookings for logged-in counselor only
    async getCounselorBookings(req, res) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ error: "Unauthorized" });
            const counselorId = Number(user.counselor_id ?? user.id ?? user.counselorId ?? user.user_id);
            if (!counselorId)
                return res.status(401).json({ error: "Unauthorized" });
            const bookings = await bookingService_1.default.getBookingsByCounselorId(counselorId);
            return res.json({ success: true, bookings });
        }
        catch (err) {
            console.error("getCounselorBookings error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    // Admin: Return all bookings
    async getAllBookingsAdmin(req, res) {
        try {
            const user = req.user;
            if (!user || String(user.role).toLowerCase() !== "admin") {
                return res.status(403).json({ error: "Forbidden" });
            }
            const bookings = await bookingService_1.default.getAllBookings();
            return res.json({ success: true, bookings });
        }
        catch (err) {
            console.error("getAllBookingsAdmin error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    // PATCH /api/bookings/:id/status - Admins or owning counselor or owning student (cancel)
    async patchBookingStatus(req, res) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ error: "Unauthorized" });
            const bookingId = req.params.id;
            const { status } = req.body;
            if (!status)
                return res.status(400).json({ error: "status required" });
            const normalized = normalizeStatus(status);
            // Admins can change any booking
            if (String(user.role).toLowerCase() === "admin") {
                const updated = await bookingService_1.default.updateBookingStatus(bookingId, normalized);
                if (!updated) {
                    return res
                        .status(404)
                        .json({ success: false, error: "Booking not found" });
                }
                // Previously we would delete a Google event here. The google service is removed;
                // if you reintroduce it restore that behavior.
                return res.json({ success: true, booking: updated });
            }
            // Student owner: allow cancelling their own booking only
            const userEmail = (user.email ?? "").toString();
            if (userEmail) {
                try {
                    const studentBookings = await bookingService_1.default.getBookingsByStudentEmail(userEmail);
                    const owned = (studentBookings || []).find((b) => String(b.booking_id) === String(bookingId));
                    if (owned) {
                        if (normalized === "canceled") {
                            const updated = await bookingService_1.default.updateBookingStatus(bookingId, normalized);
                            if (!updated) {
                                return res
                                    .status(404)
                                    .json({ success: false, error: "Booking not found" });
                            }
                            // Previously would delete Google event here; omitted.
                            return res.json({ success: true, booking: updated });
                        }
                        else {
                            return res
                                .status(403)
                                .json({ error: "Students may only cancel their bookings" });
                        }
                    }
                }
                catch (err) {
                    console.error("Error while checking student ownership in patchBookingStatus:", err);
                }
            }
            // Counselors: verify the booking belongs to them
            const counselorId = Number(user.counselor_id ?? user.id ?? user.counselorId ?? user.user_id);
            if (!counselorId)
                return res.status(403).json({ error: "Forbidden" });
            const myBookings = await bookingService_1.default.getBookingsByCounselorId(counselorId);
            const found = myBookings.find((b) => String(b.booking_id) === String(bookingId));
            if (!found)
                return res.status(403).json({ error: "Forbidden" });
            const updated = await bookingService_1.default.updateBookingStatus(bookingId, normalized);
            if (!updated) {
                return res
                    .status(404)
                    .json({ success: false, error: "Booking not found" });
            }
            // Previously would trigger Google event deletion if canceled.
            return res.json({ success: true, booking: updated });
        }
        catch (err) {
            console.error("patchBookingStatus error:", err);
            const msg = err?.message && typeof err.message === "string"
                ? err.message
                : "Server error";
            return res.status(500).json({ success: false, error: msg });
        }
    },
    // POST /api/bookings/:id/reschedule - Admin or owning counselor only
    async rescheduleBooking(req, res) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ error: "Unauthorized" });
            const bookingId = req.params.id;
            const { booking_date, booking_time } = req.body;
            if (!booking_date || !booking_time)
                return res
                    .status(400)
                    .json({ error: "booking_date and booking_time required" });
            // Admins can change any booking
            if (String(user.role).toLowerCase() === "admin") {
                // Attempt to reschedule event on Google, but do not block DB update if Google fails.
                let googleResult = null;
                try {
                    // Try to load booking row if repository supports getBookingById
                    let bookingRow = null;
                    if (typeof bookingRepository_1.default.getBookingById === "function") {
                        bookingRow = await bookingRepository_1.default.getBookingById(bookingId);
                    }
                    const gRes = await googleCalendarService_1.default.rescheduleEventForBooking(bookingRow ?? bookingId, booking_date, booking_time, 
                    // try to infer duration from bookingRow if available
                    bookingRow?.duration ?? 60);
                    googleResult = gRes;
                }
                catch (err) {
                    console.warn("Google reschedule attempt failed (admin path):", err);
                    googleResult = { success: false, error: String(err) };
                }
                // Proceed to update DB
                const updated = await bookingService_1.default.rescheduleBooking(bookingId, booking_date, booking_time);
                return res.json({
                    success: true,
                    booking: updated,
                    googleResult,
                });
            }
            // For counselors, verify ownership
            const counselorId = Number(user.counselor_id ?? user.id ?? user.counselorId ?? user.user_id);
            if (!counselorId)
                return res.status(403).json({ error: "Forbidden" });
            const myBookings = await bookingService_1.default.getBookingsByCounselorId(counselorId);
            const found = myBookings.find((b) => String(b.booking_id) === String(bookingId));
            if (!found)
                return res.status(403).json({ error: "Forbidden" });
            // Attempt Google reschedule for counselor-owned booking
            let googleResultCounselor = null;
            try {
                // pass booking row (found) to Google service to improve matching
                const gRes = await googleCalendarService_1.default.rescheduleEventForBooking(found, booking_date, booking_time, found?.duration ?? 60);
                googleResultCounselor = gRes;
            }
            catch (err) {
                console.warn("Google reschedule attempt failed (counselor path):", err);
                googleResultCounselor = { success: false, error: String(err) };
            }
            const updated = await bookingService_1.default.rescheduleBooking(bookingId, booking_date, booking_time);
            return res.json({
                success: true,
                booking: updated,
                googleResult: googleResultCounselor,
            });
        }
        catch (err) {
            console.error("rescheduleBooking error:", err);
            return res
                .status(500)
                .json({ success: false, error: err.message || "Server error" });
        }
    },
    // GET /api/bookings/export - Admin (all) or counselor (their bookings)
    async exportBookings(req, res) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ error: "Unauthorized" });
            const role = String(user.role).toLowerCase();
            let rows = [];
            if (role === "admin") {
                rows = await bookingService_1.default.getAllBookings();
            }
            else {
                const counselorId = Number(user.counselor_id ?? user.id ?? user.counselorId ?? user.user_id);
                if (!counselorId)
                    return res.status(403).json({ error: "Forbidden" });
                rows = await bookingService_1.default.getBookingsByCounselorId(counselorId);
            }
            const headers = [
                "booking_id",
                "student_name",
                "student_email",
                "counselor_id",
                "counselor_name",
                "booking_date",
                "booking_time",
                "year_level",
                "status",
                "created_at",
                "updated_at",
            ];
            const csvRows = [headers.join(",")];
            for (const r of rows) {
                const line = [
                    r.booking_id ?? "",
                    (r.student_name ?? r.userName ?? "").replace(/"/g, '""'),
                    (r.student_email ?? "").replace(/"/g, '""'),
                    r.counselor_id ?? "",
                    (r.counselor_name ?? r.therapistName ?? "").replace(/"/g, '""'),
                    r.booking_date ?? "",
                    r.booking_time ?? "",
                    r.year_level ?? "",
                    r.status ?? "",
                    r.created_at ?? "",
                    r.updated_at ?? "",
                ]
                    .map((c) => `"${String(c).replace(/"/g, '""')}"`)
                    .join(",");
                csvRows.push(line);
            }
            const csv = csvRows.join("\n");
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="bookings_export_${new Date()
                .toISOString()
                .slice(0, 10)}.csv"`);
            res.status(200).send(csv);
        }
        catch (err) {
            console.error("exportBookings error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
};
exports.default = exports.BookingController;
