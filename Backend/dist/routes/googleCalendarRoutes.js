"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/googleCalendarRoutes.ts
const express_1 = __importDefault(require("express"));
const googleCalendarController_1 = require("../controllers/googleCalendarController");
const router = express_1.default.Router();
// Example:
// GET /api/google-calendar/auth-url?counselorId=15
router.get("/auth-url", googleCalendarController_1.getAuthUrl);
// GET /api/google-calendar/callback  <-- for the OAuth redirect (also mounted under /api/counselors/google/callback)
router.get("/callback", googleCalendarController_1.oauthCallback);
// POST /api/google-calendar/oauth  { code, state, counselorId? }
router.post("/oauth", googleCalendarController_1.exchangeOauthCode);
// GET /api/google-calendar/available-slots?counselorId=15&date=2025-10-20&duration=30
router.get("/available-slots", googleCalendarController_1.getAvailableSlots);
// POST /api/google-calendar/book-session
router.post("/book-session", googleCalendarController_1.bookSession);
exports.default = router;
