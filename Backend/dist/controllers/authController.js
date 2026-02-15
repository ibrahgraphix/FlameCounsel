"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLoginHandler = exports.loginHandler = void 0;
const authService_1 = require("../services/authService");
const loginHandler = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: "email and password required" });
        }
        const result = await (0, authService_1.loginCounselor)(email, password);
        return res.json({
            success: true,
            token: result.token,
            counselor: result.counselor,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.loginHandler = loginHandler;
/**
 * Google sign-in handler
 * Expects body: { id_token: string } (the Google ID token from client)
 *
 * NOTE: If Google email is not present in counselors table (or has wrong role),
 * this endpoint now returns 403 and DOES NOT create a new counselor row.
 */
const googleLoginHandler = async (req, res, next) => {
    try {
        const { id_token } = req.body;
        if (!id_token) {
            return res
                .status(400)
                .json({ success: false, message: "id_token required" });
        }
        const result = await (0, authService_1.loginWithGoogle)(String(id_token));
        return res.json({
            success: true,
            token: result.token,
            counselor: result.counselor,
        });
    }
    catch (err) {
        console.error("googleLoginHandler error:", err);
        const status = err?.status || 500;
        const message = err?.message ||
            (status === 403
                ? "Not authorized to access counselor dashboard"
                : "Server error during Google login");
        return res.status(status).json({ success: false, message });
    }
};
exports.googleLoginHandler = googleLoginHandler;
exports.default = { loginHandler: exports.loginHandler, googleLoginHandler: exports.googleLoginHandler };
