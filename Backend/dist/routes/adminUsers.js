"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/adminUsers.ts
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const adminusersController_1 = __importDefault(require("../controllers/adminusersController"));
const router = express_1.default.Router();
// Protect everything: require auth middleware (controller will enforce admin)
router.use(authMiddleware_1.default);
// GET /api/admin/users
router.get("/users", adminusersController_1.default.getUsers);
// POST /api/admin/users
router.post("/users", adminusersController_1.default.createUser);
// PATCH /api/admin/users/:role/:id/status
router.patch("/users/:role/:id/status", adminusersController_1.default.updateStatus);
// DELETE /api/admin/users/:role/:id
router.delete("/users/:role/:id", adminusersController_1.default.removeUser);
exports.default = router;
