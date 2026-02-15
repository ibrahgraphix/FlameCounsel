"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithGoogle = exports.loginCounselor = exports.OAUTH_SCOPES = void 0;
// src/services/authService.ts
const counselorRepository_1 = require("../repositories/counselorRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../utils/jwt");
const google_auth_library_1 = require("google-auth-library");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
/**
 * Export OAuth scopes from here so other services (e.g. googleCalendarService)
 * can reuse the same canonical scope list instead of duplicating it.
 */
exports.OAUTH_SCOPES = ["https://www.googleapis.com/auth/calendar"];
const loginCounselor = async (email, password) => {
    const counselor = await (0, counselorRepository_1.findByEmail)(email);
    if (!counselor) {
        const e = new Error("Email not found");
        e.status = 404;
        throw e;
    }
    if (!counselor.password_hash) {
        const e = new Error("User has no password set");
        e.status = 401;
        throw e;
    }
    const match = await bcrypt_1.default.compare(password, counselor.password_hash);
    if (!match) {
        const e = new Error("Invalid password");
        e.status = 401;
        throw e;
    }
    try {
        await (0, counselorRepository_1.updateLastActive)(counselor.counselor_id);
    }
    catch (err) {
        console.warn("Could not update counselor last_active:", err);
    }
    const payload = {
        id: counselor.counselor_id,
        name: counselor.name,
        email: counselor.email,
        role: counselor.role,
    };
    const token = (0, jwt_1.signToken)(payload);
    return { token, counselor: payload };
};
exports.loginCounselor = loginCounselor;
/**
 * Google sign-in.
 *
 * IMPORTANT CHANGE:
 *  - Do NOT auto-create a counselor row on Google login.
 *  - Only allow login if an existing counselor/admin row is present in counselors table.
 *  - If not found, return an error (403) so frontend can refuse dashboard access.
 */
const loginWithGoogle = async (idToken) => {
    if (!GOOGLE_CLIENT_ID) {
        const e = new Error("GOOGLE_CLIENT_ID not configured on server");
        e.status = 500;
        throw e;
    }
    const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
    }
    catch (err) {
        console.error("Google token verify failed:", err);
        const e = new Error("Invalid Google ID token");
        e.status = 401;
        throw e;
    }
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        const e = new Error("Google token missing email");
        e.status = 400;
        throw e;
    }
    const email = String(payload.email).toLowerCase();
    const name = payload.name ?? payload.given_name ?? null;
    // Lookup counselor row only (do NOT create)
    const counselor = await (0, counselorRepository_1.findByEmail)(email);
    if (!counselor) {
        // No counselor row exists for this Google email → deny access
        const e = new Error("Not authorized: this account is not registered as a counselor or admin");
        e.status = 403;
        throw e;
    }
    // Ensure role is counselor or admin (be tolerant to casing)
    const role = (counselor.role ?? "").toString().toLowerCase();
    if (role !== "counselor" && role !== "admin") {
        const e = new Error("Not authorized: this account is not a counselor or admin");
        e.status = 403;
        throw e;
    }
    // update last active (best-effort)
    try {
        await (0, counselorRepository_1.updateLastActive)(counselor.counselor_id);
    }
    catch (err) {
        console.warn("Could not update counselor last_active:", err);
    }
    const tokenPayload = {
        id: counselor.counselor_id,
        name: counselor.name,
        email: counselor.email,
        role: counselor.role ?? "counselor",
    };
    const token = (0, jwt_1.signToken)(tokenPayload);
    return { token, counselor: tokenPayload };
};
exports.loginWithGoogle = loginWithGoogle;
