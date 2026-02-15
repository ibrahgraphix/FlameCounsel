"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/adminAnalytics.ts
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const adminanalytics_1 = __importDefault(require("../controllers/adminanalytics"));
const router = express_1.default.Router();
// Protect everything with requireAuth (it sets req.user)
router.use(authMiddleware_1.default);
// GET /api/admin/analytics
router.get("/", adminanalytics_1.default.getAnalytics);
exports.default = router;
