"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const sslOptions = {
    cert: fs_1.default.readFileSync("/opt/View/sslcertificates/council_certificate.crt"),
    ca: fs_1.default.readFileSync("/opt/View/sslcertificates/council_bundle.crt"),
    key: fs_1.default.readFileSync("/opt/View/sslcertificates/council.key"),
};
// absolute path to Frontend/dist
const clientBuildPath = path_1.default.resolve(__dirname, "../../Frontend/dist");
console.log("[frontend] Serving client from:", clientBuildPath);
// 1️⃣ serve static FIRST
app.use(express_1.default.static(clientBuildPath));
// 2️⃣ health check
app.get("/health", (_req, res) => res.json({ ok: true }));
// 3️⃣ SPA fallback ONLY for non-file routes
app.get("*", (req, res) => {
    // if request looks like a file (.js/.css/.png etc) → 404
    if (req.path.includes(".")) {
        return res.status(404).end();
    }
    res.sendFile(path_1.default.join(clientBuildPath, "index.html"));
});
const PORT = parseInt(process.env.FRONTEND_PORT || "7070", 10);
https_1.default.createServer(sslOptions, app).listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend server listening on https://flamestudentcouncil.in:${PORT}`);
});
