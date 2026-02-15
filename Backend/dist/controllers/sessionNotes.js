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
exports.listNotesForCounselor = exports.createNote = void 0;
const service = __importStar(require("../services/sessionNotes"));
/**
 * Helper: extract counselor id from token payload (req.user).
 * Accepts several token shapes: { id }, { userId }, { user_id }.
 */
const extractCounselorId = (req) => {
    const u = req.user;
    if (!u)
        return null;
    const id = u.id ?? u.userId ?? u.user_id;
    if (typeof id === "number")
        return id;
    if (typeof id === "string" && /^\d+$/.test(id))
        return Number(id);
    return null;
};
const createNote = async (req, res) => {
    try {
        const counselorId = extractCounselorId(req);
        if (!counselorId)
            return res.status(401).json({ message: "Unauthorized" });
        let { student_id, session_datetime, notes } = req.body ?? {};
        // Basic presence validation
        if (!student_id || !notes) {
            return res.status(400).json({
                message: "student_id and notes are required",
            });
        }
        // numeric student_id conversion and simple validation
        student_id = Number(student_id);
        if (!Number.isInteger(student_id) || student_id <= 0) {
            return res.status(400).json({ message: "Invalid student_id" });
        }
        // If session_datetime not provided, use current server time (ISO)
        if (!session_datetime) {
            session_datetime = new Date().toISOString();
        }
        else {
            session_datetime = String(session_datetime);
        }
        // Ensure student exists in DB (so we don't insert orphaned FK)
        const student = await service.lookupStudentById(student_id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const payload = {
            student_id,
            counselor_id: counselorId,
            session_datetime,
            notes: String(notes),
        };
        const created = await service.createSessionNote(payload);
        // Return created row (includes created_at)
        return res.status(201).json(created);
    }
    catch (err) {
        console.error("createNote error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.createNote = createNote;
const listNotesForCounselor = async (req, res) => {
    try {
        const counselorId = extractCounselorId(req);
        if (!counselorId)
            return res.status(401).json({ message: "Unauthorized" });
        const notes = await service.getNotesByCounselor(counselorId);
        return res.json(notes);
    }
    catch (err) {
        console.error("listNotesForCounselor error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.listNotesForCounselor = listNotesForCounselor;
