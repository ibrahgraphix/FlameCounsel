"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const counselorSettingsRepository_1 = __importDefault(require("../repositories/counselorSettingsRepository"));
const getSettings = async (counselorId) => {
    const [availability, sessionDuration] = await Promise.all([
        counselorSettingsRepository_1.default.getCounselorAvailability(counselorId),
        counselorSettingsRepository_1.default.getSessionDuration(counselorId)
    ]);
    return { availability, sessionDuration };
};
const updateSettings = async (counselorId, data) => {
    await Promise.all([
        counselorSettingsRepository_1.default.updateCounselorAvailability(counselorId, data.availability),
        counselorSettingsRepository_1.default.updateSessionDuration(counselorId, data.sessionDuration)
    ]);
    return { success: true };
};
exports.default = {
    getSettings,
    updateSettings
};
