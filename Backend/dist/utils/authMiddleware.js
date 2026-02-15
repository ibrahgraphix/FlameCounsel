"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("./jwt");
const requireAuth = (req, res, next) => {
    // look in header first
    const authHeader = (req.headers["authorization"] || "");
    let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    // if not present in header, check body (useful for guest access_token)
    if (!token) {
        try {
            // body may be parsed by express.json() already
            const bodyToken = req.body?.access_token;
            if (bodyToken && typeof bodyToken === "string")
                token = bodyToken;
        }
        catch (e) {
            // ignore
        }
    }
    // if still no token, check query param
    if (!token) {
        try {
            const q = req.query?.access_token;
            if (q && typeof q === "string")
                token = q;
        }
        catch (e) { }
    }
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.JWT_SECRET);
        // Debug line can help while testing — remove or comment in production.
        console.log("[auth] decoded token:", decoded);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error("JWT verify error:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
exports.requireAuth = requireAuth;
exports.default = exports.requireAuth;
