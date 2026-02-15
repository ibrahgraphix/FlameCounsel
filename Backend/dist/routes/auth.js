"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.ts
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post("/login", authController_1.loginHandler);
router.post("/google", authController_1.googleLoginHandler);
exports.default = router;
