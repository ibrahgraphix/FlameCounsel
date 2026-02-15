"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/sessionNotes.ts
const express_1 = require("express");
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const sessionNotes_1 = require("../controllers/sessionNotes");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.default);
router.get("/", sessionNotes_1.listNotesForCounselor);
router.post("/", sessionNotes_1.createNote);
exports.default = router;
