"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const counselorSettingsService_1 = __importDefault(require("../services/counselorSettingsService"));
const getSettings = async (req, res) => {
    try {
        const counselorId = Number(req.params.id);
        if (!counselorId)
            return res.status(400).json({ error: "Counselor ID required" });
        const settings = await counselorSettingsService_1.default.getSettings(counselorId);
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const counselorId = Number(req.params.id);
        if (!counselorId)
            return res.status(400).json({ error: "Counselor ID required" });
        const { availability, sessionDuration } = req.body;
        await counselorSettingsService_1.default.updateSettings(counselorId, { availability, sessionDuration });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateSettings = updateSettings;
