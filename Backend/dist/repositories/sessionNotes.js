"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentById = exports.findByCounselor = exports.create = void 0;
// src/repositories/sessionNotesRepository.ts
const db_1 = __importDefault(require("../config/db"));
/**
 * Create session note and return created row.
 */
const create = async (payload) => {
    const { student_id, counselor_id, session_datetime, notes } = payload;
    const q = `
    INSERT INTO session_notes (student_id, counselor_id, session_datetime, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING note_id, student_id, counselor_id, session_datetime, notes, created_at
  `;
    const values = [student_id, counselor_id, session_datetime, notes];
    const { rows } = await db_1.default.query(q, values);
    return rows[0];
};
exports.create = create;
/**
 * Find all session notes for a counselor (ordered by created_at desc).
 * This version joins with students so each row includes student_name and student_email.
 */
const findByCounselor = async (counselor_id) => {
    const q = `
    SELECT 
      sn.note_id,
      sn.student_id,
      sn.counselor_id,
      sn.session_datetime,
      sn.notes,
      sn.created_at,
      s.name AS student_name,
      s.email AS student_email
    FROM session_notes sn
    LEFT JOIN students s ON s.student_id = sn.student_id
    WHERE sn.counselor_id = $1
    ORDER BY sn.created_at DESC, sn.session_datetime DESC
  `;
    const { rows } = await db_1.default.query(q, [counselor_id]);
    return rows;
};
exports.findByCounselor = findByCounselor;
/**
 * Utility: check whether a student exists by id.
 */
const getStudentById = async (student_id) => {
    const q = `SELECT student_id, name, email, created_at, updated_at FROM students WHERE student_id = $1 LIMIT 1`;
    const { rows } = await db_1.default.query(q, [student_id]);
    return rows[0] ?? null;
};
exports.getStudentById = getStudentById;
