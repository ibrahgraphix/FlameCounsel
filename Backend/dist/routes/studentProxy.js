"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/studentProxy.ts
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
const STUDENT_API_BASE = process.env.STUDENT_API_BASE || "https://studenttracking.in:5173/employee";
const AXIOS_TIMEOUT_MS = Number(process.env.STUDENT_PROXY_TIMEOUT_MS) || 10000;
router.get("/student-lookup", async (req, res) => {
    try {
        const code = String(req.query.code ?? "").trim();
        if (!code) {
            return res
                .status(400)
                .json({ message: "query parameter `code` is required" });
        }
        // Build upstream URL (simple GET with ?code=...)
        const upstreamUrl = `${STUDENT_API_BASE}?code=${encodeURIComponent(code)}`;
        // Server-to-server fetch — avoids browser CORS restrictions
        const response = await axios_1.default.get(upstreamUrl, {
            timeout: AXIOS_TIMEOUT_MS,
            headers: {
                Accept: "application/json",
            },
            responseType: "json",
            // you can configure other axios options here if needed
        });
        // Forward upstream status & JSON body directly
        return res.status(response.status).json(response.data);
    }
    catch (err) {
        // Axios errors include response when upstream returned non-2xx
        if (axios_1.default.isAxiosError(err)) {
            const status = err.response?.status ?? 502;
            const data = err.response?.data ?? { message: err.message };
            // log for server debugging
            console.error("student-lookup proxy axios error:", err.message, "upstreamStatus:", status);
            return res.status(status).json({
                proxied: true,
                upstreamStatus: status,
                upstreamData: data,
            });
        }
        console.error("student-lookup proxy unexpected error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
