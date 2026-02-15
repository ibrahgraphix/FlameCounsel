"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/userRoutes.ts
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const usersController_1 = __importDefault(require("../controllers/usersController"));
const router = express_1.default.Router();
// GET /api/admin/users  (protected - requireAuth will set req.user)
router.get("/users", authMiddleware_1.default, usersController_1.default.getAllUsers);
// POST /api/admin/users  (create a new user) - protected
router.post("/users", authMiddleware_1.default, usersController_1.default.createUser);
exports.default = router;
