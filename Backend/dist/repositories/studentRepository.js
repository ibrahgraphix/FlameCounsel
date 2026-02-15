"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRepository = void 0;
// src/repositories/studentRepository.ts
const db_1 = __importDefault(require("../config/db"));
exports.studentRepository = {
    async findByEmail(email, client) {
        const q = `SELECT student_id, name, email, created_at, updated_at, last_active, status
       FROM students
       WHERE email = $1
       LIMIT 1`;
        const res = client
            ? await client.query(q, [email])
            : await db_1.default.query(q, [email]);
        return res.rows[0] ?? null;
    },
    async create(name, email, client) {
        const q = `INSERT INTO students (name, email, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING student_id, name, email, created_at, updated_at`;
        const res = client
            ? await client.query(q, [name, email])
            : await db_1.default.query(q, [name, email]);
        return res.rows[0];
    },
    async findByName(name, client) {
        const q = `SELECT student_id, name, email, created_at, updated_at, last_active, status
       FROM students
       WHERE name ILIKE '%' || $1 || '%'
       ORDER BY student_id ASC
       LIMIT 1`;
        const res = client
            ? await client.query(q, [name])
            : await db_1.default.query(q, [name]);
        return res.rows[0] ?? null;
    },
    async findByNamePartial(term, client) {
        const q = `SELECT student_id, name, email, created_at, updated_at, last_active, status
      FROM students
      WHERE name ILIKE '%' || $1 || '%'
      ORDER BY name
      LIMIT 50`;
        const res = client
            ? await client.query(q, [term])
            : await db_1.default.query(q, [term]);
        return res.rows ?? [];
    },
    /**
     * Update last_active timestamp to NOW() for the given student.
     * Returns true if updated (rowCount > 0).
     */
    async updateLastActive(student_id) {
        try {
            const q = `UPDATE students SET last_active = NOW() WHERE student_id = $1`;
            const res = await db_1.default.query(q, [student_id]);
            return res.rowCount > 0;
        }
        catch (err) {
            console.error("studentRepository.updateLastActive error:", err);
            return false;
        }
    },
    /**
     * Set status (e.g. 'active'/'inactive') on student row.
     */
    async setStatus(student_id, status) {
        try {
            const q = `UPDATE students SET status = $1 WHERE student_id = $2`;
            const res = await db_1.default.query(q, [status, student_id]);
            return res.rowCount > 0;
        }
        catch (err) {
            console.error("studentRepository.setStatus error:", err);
            return false;
        }
    },
    async delete(student_id) {
        try {
            const q = `DELETE FROM students WHERE student_id = $1`;
            const res = await db_1.default.query(q, [student_id]);
            return res.rowCount > 0;
        }
        catch (err) {
            console.error("studentRepository.delete error:", err);
            return false;
        }
    },
};
