"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchStudents = exports.getStudentByName = void 0;
const studentRepository_1 = require("../repositories/studentRepository");
/**
 * GET /api/students?name=Full%20Name
 * Returns first student row that matches the provided name (case-insensitive, partial).
 */
const getStudentByName = async (req, res) => {
    try {
        const name = String(req.query.name ?? "").trim();
        if (!name) {
            return res.status(400).json({ message: "name query param is required" });
        }
        const student = await studentRepository_1.studentRepository.findByName(name);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.json(student);
    }
    catch (err) {
        console.error("getStudentByName error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getStudentByName = getStudentByName;
/**
 * Optional: GET /api/students/search?q=term
 * Returns up to 50 matching students for autocomplete.
 */
const searchStudents = async (req, res) => {
    try {
        const q = String(req.query.q ?? "").trim();
        if (!q)
            return res.json([]);
        const rows = await studentRepository_1.studentRepository.findByNamePartial(q);
        return res.json(rows);
    }
    catch (err) {
        console.error("searchStudents error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.searchStudents = searchStudents;
