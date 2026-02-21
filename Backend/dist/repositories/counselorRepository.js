"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCounselor = exports.updateProfile = exports.setStatus = exports.updateLastActive = exports.unsetGoogleConnection = exports.storeGoogleTokens = exports.findCounselorByOAuthState = exports.setGoogleOAuthState = exports.createCounselor = exports.findByEmail = exports.getCounselorById = exports.getAllCounselors = void 0;
// src/repositories/counselorRepository.ts
const db_1 = __importDefault(require("../config/db"));
const normalizeRow = (r) => ({
    counselor_id: r.counselor_id ?? r.id ?? null,
    name: r.name ?? r.full_name ?? null,
    email: r.email ?? r.email_address ?? null,
    password_hash: r.password_hash ?? null,
    role: r.role ?? null,
    specialty: r.specialty ?? r.speciality ?? null, // support both spellings
    // Google OAuth / calendar columns (may be null / absent in older DB)
    google_connected: r.google_connected === true ||
        r.google_connected === "t" ||
        r.google_connected === 1 ||
        r.google_connected === "1"
        ? true
        : false,
    google_access_token: r.google_access_token ?? null,
    google_refresh_token: r.google_refresh_token ?? null,
    google_token_expiry: r.google_token_expiry ?? null,
    google_calendar_id: r.google_calendar_id ?? null,
    google_oauth_state: r.google_oauth_state ?? null,
    last_active: r.last_active ?? r.lastActive ?? null,
    status: r.status ??
        (typeof r.is_active !== "undefined"
            ? r.is_active
                ? "active"
                : "inactive"
            : null),
    profile_picture: r.profile_picture ?? null,
    bio: r.bio ?? null,
    raw: r,
});
const getAllCounselors = async () => {
    try {
        const res = await db_1.default.query(`SELECT * FROM counselors ORDER BY counselor_id`);
        return res.rows.map(normalizeRow);
    }
    catch (err) {
        console.error("getAllCounselors error:", err);
        return [];
    }
};
exports.getAllCounselors = getAllCounselors;
const getCounselorById = async (id) => {
    try {
        const res = await db_1.default.query(`SELECT * FROM counselors WHERE counselor_id = $1 LIMIT 1`, [id]);
        if (res.rows.length === 0)
            return null;
        return normalizeRow(res.rows[0]);
    }
    catch (err) {
        console.error("getCounselorById error:", err);
        return null;
    }
};
exports.getCounselorById = getCounselorById;
const findByEmail = async (email) => {
    try {
        const res = await db_1.default.query(`SELECT * FROM counselors WHERE lower(email) = lower($1) LIMIT 1`, [email]);
        if (res.rows.length === 0)
            return null;
        return normalizeRow(res.rows[0]);
    }
    catch (err) {
        console.error("findByEmail error:", err);
        return null;
    }
};
exports.findByEmail = findByEmail;
const createCounselor = async (name, email, role = "counselor", passwordHash = null) => {
    // Primary query (includes created_at/updated_at)
    const qPrimary = `
    INSERT INTO counselors
      (name, email, password_hash, role, status, created_at, updated_at)
    VALUES
      ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING *
  `;
    // Fallback query (omits timestamps) for older schemas
    const qFallback = `
    INSERT INTO counselors
      (name, email, password_hash, role, status)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING *
  `;
    const status = "active";
    try {
        const res = await db_1.default.query(qPrimary, [
            name ?? null,
            email,
            passwordHash,
            role,
            status,
        ]);
        if (!res || !res.rows || res.rows.length === 0)
            return null;
        return normalizeRow(res.rows[0]);
    }
    catch (err) {
        console.error("createCounselor primary error:", err);
        // If the DB reports "column does not exist" (Postgres code 42703),
        // retry with the fallback query that excludes created_at/updated_at
        if (err && err.code === "42703") {
            try {
                const res2 = await db_1.default.query(qFallback, [
                    name ?? null,
                    email,
                    passwordHash,
                    role,
                    status,
                ]);
                if (!res2 || !res2.rows || res2.rows.length === 0)
                    return null;
                return normalizeRow(res2.rows[0]);
            }
            catch (err2) {
                console.error("createCounselor fallback error:", err2);
                if (err2.code === "23505") {
                    // unique_violation
                    const e = new Error("Email already exists");
                    e.status = 409;
                    throw e;
                }
                throw err2;
            }
        }
        // Existing handling for unique violation on primary attempt
        if (err.code === "23505") {
            const e = new Error("Email already exists");
            e.status = 409;
            throw e;
        }
        throw err;
    }
};
exports.createCounselor = createCounselor;
/* ---------------- Google helpers ---------------- */
const setGoogleOAuthState = async (counselorId, state) => {
    try {
        await db_1.default.query(`UPDATE counselors SET google_oauth_state = $1 WHERE counselor_id = $2`, [state, counselorId]);
        return true;
    }
    catch (err) {
        console.error("setGoogleOAuthState error:", err);
        return false;
    }
};
exports.setGoogleOAuthState = setGoogleOAuthState;
const findCounselorByOAuthState = async (state) => {
    try {
        const res = await db_1.default.query(`SELECT * FROM counselors WHERE google_oauth_state = $1 LIMIT 1`, [state]);
        if (res.rows.length === 0)
            return null;
        return normalizeRow(res.rows[0]);
    }
    catch (err) {
        console.error("findCounselorByOAuthState error:", err);
        return null;
    }
};
exports.findCounselorByOAuthState = findCounselorByOAuthState;
const storeGoogleTokens = async (counselorId, accessToken, refreshToken, expiryDate, calendarId) => {
    try {
        // Convert expiryDate (ms since epoch or ISO string) into ISO timestamp, or null.
        let expiryISO = null;
        if (expiryDate !== null && typeof expiryDate !== "undefined") {
            // expiryDate can be string like "1760793105956" or number 1760793105956 or ISO string.
            // Try to coerce to number first; if it's a valid number, treat as ms since epoch.
            const asNum = typeof expiryDate === "number" ? expiryDate : Number(expiryDate);
            if (!isNaN(asNum) && String(expiryDate).length >= 10) {
                // treat as ms since epoch if it's a large number (ms)
                // if it's in seconds, new Date(asNum*1000) would be needed; Google uses ms.
                expiryISO = new Date(asNum).toISOString();
            }
            else {
                // fallback: if string and parseable as ISO, use it
                const parsed = Date.parse(String(expiryDate));
                if (!isNaN(parsed))
                    expiryISO = new Date(parsed).toISOString();
                else
                    expiryISO = null;
            }
        }
        await db_1.default.query(`UPDATE counselors
         SET google_connected = TRUE,
             google_access_token = $1,
             google_refresh_token = $2,
             google_token_expiry = $3,
             google_calendar_id = COALESCE($4, google_calendar_id),
             google_oauth_state = NULL
       WHERE counselor_id = $5`, [accessToken, refreshToken, expiryISO, calendarId ?? null, counselorId]);
        return true;
    }
    catch (err) {
        console.error("storeGoogleTokens error:", err);
        return false;
    }
};
exports.storeGoogleTokens = storeGoogleTokens;
const unsetGoogleConnection = async (counselorId) => {
    try {
        await db_1.default.query(`UPDATE counselors
         SET google_connected = FALSE,
             google_access_token = NULL,
             google_refresh_token = NULL,
             google_token_expiry = NULL,
             google_calendar_id = NULL,
             google_oauth_state = NULL
       WHERE counselor_id = $1`, [counselorId]);
        return true;
    }
    catch (err) {
        console.error("unsetGoogleConnection error:", err);
        return false;
    }
};
exports.unsetGoogleConnection = unsetGoogleConnection;
const updateLastActive = async (counselorId) => {
    try {
        const q = `UPDATE counselors SET last_active = NOW() WHERE counselor_id = $1`;
        const r = await db_1.default.query(q, [counselorId]);
        return r.rowCount > 0;
    }
    catch (err) {
        console.error("counselorRepository.updateLastActive error:", err);
        return false;
    }
};
exports.updateLastActive = updateLastActive;
const setStatus = async (counselorId, status) => {
    try {
        const q = `UPDATE counselors SET status = $1 WHERE counselor_id = $2`;
        const r = await db_1.default.query(q, [status, counselorId]);
        return r.rowCount > 0;
    }
    catch (err) {
        console.error("counselorRepository.setStatus error:", err);
        return false;
    }
};
exports.setStatus = setStatus;
const updateProfile = async (counselorId, data) => {
    try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (data.name !== undefined) {
            fields.push(`name = $${idx++}`);
            values.push(data.name);
        }
        if (data.bio !== undefined) {
            fields.push(`bio = $${idx++}`);
            values.push(data.bio);
        }
        if (data.profile_picture !== undefined) {
            fields.push(`profile_picture = $${idx++}`);
            values.push(data.profile_picture);
        }
        if (fields.length === 0)
            return null;
        values.push(counselorId);
        const query = `UPDATE counselors SET ${fields.join(", ")}, updated_at = NOW() WHERE counselor_id = $${idx} RETURNING *`;
        const res = await db_1.default.query(query, values);
        if (res.rows.length === 0)
            return null;
        return normalizeRow(res.rows[0]);
    }
    catch (err) {
        console.error("updateProfile error:", err);
        return null;
    }
};
exports.updateProfile = updateProfile;
const deleteCounselor = async (counselorId) => {
    try {
        const q = `DELETE FROM counselors WHERE counselor_id = $1`;
        const r = await db_1.default.query(q, [counselorId]);
        return r.rowCount > 0;
    }
    catch (err) {
        console.error("counselorRepository.delete error:", err);
        return false;
    }
};
exports.deleteCounselor = deleteCounselor;
exports.default = {
    getAllCounselors: exports.getAllCounselors,
    getCounselorById: exports.getCounselorById,
    findByEmail: exports.findByEmail,
    createCounselor: exports.createCounselor,
    updateLastActive: exports.updateLastActive,
    setStatus: exports.setStatus,
    updateProfile: exports.updateProfile,
    delete: exports.deleteCounselor,
    setGoogleOAuthState: exports.setGoogleOAuthState,
    findCounselorByOAuthState: exports.findCounselorByOAuthState,
    storeGoogleTokens: exports.storeGoogleTokens,
    unsetGoogleConnection: exports.unsetGoogleConnection,
};
