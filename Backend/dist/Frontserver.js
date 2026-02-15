"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Frontserver.ts (front-end server, now in Backend folder)
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// In CommonJS builds (__dirname exists), so use that instead of import.meta.url
const app = (0, express_1.default)();
// Load SSL certificates
const sslOptions = {
    cert: fs_1.default.readFileSync("/opt/View/sslcertificates/council_certificate.crt"),
    ca: fs_1.default.readFileSync("/opt/View/sslcertificates/council_bundle.crt"),
    key: fs_1.default.readFileSync("/opt/View/sslcertificates/council.key"),
};
// Find the client build directory (adjusted for sibling Frontend folder)
// Using __dirname (this file's folder) to compute path relative to the Backend folder
const frontendDir = path_1.default.join(__dirname, "..", "..", "Frontend");
const buildCandidates = [
    path_1.default.join(frontendDir, "dist"), // Vite monorepo client/dist
    path_1.default.join(frontendDir, "build"), // CRA convention
    path_1.default.join(frontendDir, "dist"), // simple root dist (duplicate for safety)
    path_1.default.join(frontendDir, "public"), // fallback public
];
const clientBuildPath = buildCandidates.find((p) => fs_1.default.existsSync(p) && fs_1.default.statSync(p).isDirectory());
if (clientBuildPath) {
    // Serve static files
    app.use(express_1.default.static(clientBuildPath));
    // Fallback: serve index.html for any route (SPA routing)
    app.get("*", (req, res) => {
        const indexHtml = path_1.default.join(clientBuildPath, "index.html");
        if (fs_1.default.existsSync(indexHtml)) {
            res.sendFile(indexHtml);
        }
        else {
            res.status(404).send("Not Found");
        }
    });
    console.log(`[frontend] Serving client from: ${clientBuildPath}`);
}
else {
    console.log("[frontend] No client build found; static serving disabled.");
}
// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));
const PORT = parseInt(process.env.FRONTEND_PORT || "7070", 10);
https_1.default.createServer(sslOptions, app).listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend server listening on https://flamestudentcouncil.in:${PORT} (bound to 0.0.0.0)`);
});
