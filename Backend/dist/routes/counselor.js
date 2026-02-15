"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/counselor.ts
const express_1 = __importDefault(require("express"));
const counselorController_1 = require("../controllers/counselorController");
const router = express_1.default.Router();
// GET /api/counselors
router.get("/", counselorController_1.CounselorController.getAll);
// GET /api/counselors/:id
router.get("/:id", counselorController_1.CounselorController.getById);
exports.default = router;
