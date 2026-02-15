"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/google.ts
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const router = express_1.default.Router();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const oAuth2Client = new googleapis_1.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// Redirect user to Google for consent (handy for manual testing)
router.get("/auth", (_req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: true,
        scope: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
            "profile",
            "email",
        ],
    });
    res.redirect(authUrl);
});
// callback (manual testing only — your controller handles production callback)
router.get("/callback", async (req, res) => {
    const code = req.query.code;
    if (!code)
        return res.status(400).json({ error: "Missing code" });
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        res.json({ success: true, tokens });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to exchange code" });
    }
});
exports.default = router;
