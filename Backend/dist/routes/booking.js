"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/bookings.ts
const express_1 = __importDefault(require("express"));
const bookingController_1 = __importDefault(require("../controllers/bookingController"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware")); // adjust path if your middleware is elsewhere
const router = express_1.default.Router();
// Booking creation requires verification; send-code + verify-code endpoints support that flow
router.post("/send-code", bookingController_1.default.sendVerificationCode);
router.post("/verify-code", bookingController_1.default.verifyVerificationCode);
router.post("/", bookingController_1.default.createBooking);
router.post("/student/view", bookingController_1.default.getStudentBookingsProtected);
router.get("/student/:email", bookingController_1.default.getStudentBookingsDeprecated);
router.get("/counselor", authMiddleware_1.default, bookingController_1.default.getCounselorBookings);
router.get("/admin", authMiddleware_1.default, bookingController_1.default.getAllBookingsAdmin);
router.patch("/:id/status", authMiddleware_1.default, bookingController_1.default.patchBookingStatus);
router.post("/:id/reschedule", authMiddleware_1.default, bookingController_1.default.rescheduleBooking);
// Export bookings as CSV
router.get("/export", authMiddleware_1.default, bookingController_1.default.exportBookings);
exports.default = router;
