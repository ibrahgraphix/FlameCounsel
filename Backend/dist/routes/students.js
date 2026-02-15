"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/students.ts
const express_1 = require("express");
const studentController_1 = require("../controllers/studentController");
const router = (0, express_1.Router)();
router.get("/", studentController_1.getStudentByName);
router.get("/search", studentController_1.searchStudents);
exports.default = router;
