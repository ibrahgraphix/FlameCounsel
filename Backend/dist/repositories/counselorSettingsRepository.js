"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionDuration = exports.updateSessionDuration = exports.updateCounselorAvailability = exports.getCounselorAvailability = void 0;
const db_1 = __importDefault(require("../config/db"));
const getCounselorAvailability = async (counselorId) => {
    const res = await db_1.default.query("SELECT * FROM counselor_availability WHERE counselor_id = $1 ORDER BY day_of_week", [counselorId]);
    return res.rows;
};
exports.getCounselorAvailability = getCounselorAvailability;
const updateCounselorAvailability = async (counselorId, availabilities) => {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        // Delete existing availability for this counselor
        await client.query("DELETE FROM counselor_availability WHERE counselor_id = $1", [counselorId]);
        // Insert new availabilities
        for (const av of availabilities) {
            if (av.is_enabled) {
                await client.query("INSERT INTO counselor_availability (counselor_id, day_of_week, start_time, end_time, is_enabled) VALUES ($1, $2, $3, $4, $5)", [counselorId, av.day_of_week, av.start_time, av.end_time, av.is_enabled]);
            }
        }
        await client.query("COMMIT");
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
};
exports.updateCounselorAvailability = updateCounselorAvailability;
const updateSessionDuration = async (counselorId, duration) => {
    await db_1.default.query("UPDATE counselors SET session_duration = $1 WHERE counselor_id = $2", [duration, counselorId]);
};
exports.updateSessionDuration = updateSessionDuration;
const getSessionDuration = async (counselorId) => {
    const res = await db_1.default.query("SELECT session_duration FROM counselors WHERE counselor_id = $1", [counselorId]);
    return res.rows[0]?.session_duration ?? 60;
};
exports.getSessionDuration = getSessionDuration;
exports.default = {
    getCounselorAvailability: exports.getCounselorAvailability,
    updateCounselorAvailability: exports.updateCounselorAvailability,
    updateSessionDuration: exports.updateSessionDuration,
    getSessionDuration: exports.getSessionDuration
};
