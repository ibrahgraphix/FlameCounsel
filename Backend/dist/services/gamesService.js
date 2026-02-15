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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeeklyMoodDistribution = exports.saveGameParticipation = exports.getMoodEntriesByUser = exports.saveMoodEntry = void 0;
// src/services/games.service.ts
const repo = __importStar(require("../repositories/gamesRepository"));
const date_fns_1 = require("date-fns");
const saveMoodEntry = async (payload) => {
    // default date to today if missing
    if (!payload.date) {
        payload.date = (0, date_fns_1.format)(new Date(), "yyyy-MM-dd");
    }
    // coerce mood if possible
    if (typeof payload.mood !== "number") {
        const maybeNum = payload.mood !== undefined && payload.mood !== null
            ? Number(payload.mood)
            : NaN;
        if (!Number.isNaN(maybeNum)) {
            payload.mood = maybeNum;
        }
    }
    if (typeof payload.mood !== "number" || Number.isNaN(payload.mood)) {
        throw new Error("mood is required and must be a number 1..5");
    }
    // ensure mood range
    if (payload.mood < 1 || payload.mood > 5) {
        throw new Error("mood must be between 1 and 5");
    }
    // optional: validate anxiety/sleep if present (coerce strings to numbers)
    if (payload.anxiety !== undefined && payload.anxiety !== null) {
        const aNum = Number(payload.anxiety);
        payload.anxiety = Number.isNaN(aNum) ? null : aNum;
    }
    if (payload.sleep !== undefined && payload.sleep !== null) {
        const sNum = Number(payload.sleep);
        payload.sleep = Number.isNaN(sNum) ? null : sNum;
    }
    return repo.saveMoodEntry(payload);
};
exports.saveMoodEntry = saveMoodEntry;
/**
 * Fetch user mood entries (simple pass-through)
 */
const getMoodEntriesByUser = async (userId) => {
    if (!userId)
        throw new Error("userId is required");
    return repo.getMoodEntriesByUser(userId);
};
exports.getMoodEntriesByUser = getMoodEntriesByUser;
/**
 * Save generic game participation
 */
const saveGameParticipation = async (payload) => {
    if (!payload.gameName)
        throw new Error("gameName is required");
    return repo.saveGameParticipation(payload);
};
exports.saveGameParticipation = saveGameParticipation;
/**
 * Build mood distribution array used by admin dashboard.
 */
const getWeeklyMoodDistribution = async (days = 7) => {
    const raw = await repo.getMoodCountsGroupedByDateAndMood(days);
    const map = new Map();
    raw.forEach((r) => {
        // r.day may be Date object
        const dayStr = r.day instanceof Date
            ? (0, date_fns_1.format)(new Date(r.day), "yyyy-MM-dd")
            : String(r.day);
        const mood = Number(r.mood);
        const cnt = Number(r.cnt);
        if (!map.has(dayStr))
            map.set(dayStr, {});
        map.get(dayStr)[mood] = cnt;
    });
    const res = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = (0, date_fns_1.subDays)(new Date(), i);
        const dateStr = (0, date_fns_1.format)(d, "yyyy-MM-dd");
        const dayName = (0, date_fns_1.format)(d, "EEE"); // Mon/Tue...
        const row = map.get(dateStr) ?? {};
        res.push({
            name: dayName,
            excellent: row[5] ?? 0,
            good: row[4] ?? 0,
            neutral: row[3] ?? 0,
            poor: row[2] ?? 0,
            bad: row[1] ?? 0,
        });
    }
    return res;
};
exports.getWeeklyMoodDistribution = getWeeklyMoodDistribution;
