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
exports.getAdminWeeklyMood = exports.postParticipate = exports.getMoodEntries = exports.postMood = void 0;
const service = __importStar(require("../services/gamesService"));
/**
 * POST /api/games/mood
 */
const postMood = async (req, res) => {
    try {
        // Log incoming request path and a short body preview for debugging
        console.info(`[gamesController] POST ${req.path} payload:`, {
            userId: req.body?.userId ?? null,
            mood: req.body?.mood ?? null,
            date: req.body?.date ?? null,
        });
        const payload = req.body;
        // If user is not logged-in, frontend may send userId: null
        const saved = await service.saveMoodEntry(payload);
        return res.status(201).json({ success: true, data: saved });
    }
    catch (err) {
        console.error("postMood error:", err);
        // Return 400 for validation errors (service throws) but include message
        return res
            .status(400)
            .json({ success: false, message: err.message || "Bad request" });
    }
};
exports.postMood = postMood;
/**
 * GET /api/games/mood-entries?userId=123
 */
const getMoodEntries = async (req, res) => {
    try {
        const userIdQ = req.query.userId;
        if (!userIdQ) {
            return res
                .status(400)
                .json({ success: false, message: "userId query param required" });
        }
        const userId = Number(userIdQ);
        if (Number.isNaN(userId)) {
            return res
                .status(400)
                .json({ success: false, message: "userId must be a number" });
        }
        const entries = await service.getMoodEntriesByUser(userId);
        return res.json({ success: true, data: entries });
    }
    catch (err) {
        console.error("getMoodEntries error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.getMoodEntries = getMoodEntries;
/**
 * POST /api/games/participate
 * Body: { userId?, gameName, score?, meta? }
 */
const postParticipate = async (req, res) => {
    try {
        const payload = req.body;
        const saved = await service.saveGameParticipation(payload);
        return res.status(201).json({ success: true, data: saved });
    }
    catch (err) {
        console.error("postParticipate error:", err);
        return res
            .status(400)
            .json({ success: false, message: err.message || "Bad request" });
    }
};
exports.postParticipate = postParticipate;
/**
 * GET /api/games/admin-weekly-mood?days=7
 */
const getAdminWeeklyMood = async (req, res) => {
    try {
        const days = req.query.days ? Number(req.query.days) : 7;
        const daysSafe = Number.isInteger(days) && days > 0 && days <= 30 ? days : 7;
        const data = await service.getWeeklyMoodDistribution(daysSafe);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error("getAdminWeeklyMood error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.getAdminWeeklyMood = getAdminWeeklyMood;
