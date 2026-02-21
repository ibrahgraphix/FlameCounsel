"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Backend/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
let authRouter = null;
let bookingRoutes = null;
let counselorsRouter = null;
let adminUsersRoutes = null;
let sessionNotesRoutes = null;
let studentsRoutes = null;
let adminUsersRouter = null;
let adminAnalyticsRouter = null;
let googleCalendarRoutes = null;
let studentProxy = null;
let gamesRouter = null;
let counselorSettingsRouter = null;
function tryRequire(p) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(p);
        // support both default export and module.exports
        return mod && mod.default ? mod.default : mod;
    }
    catch (err) {
        console.warn(`[app] Could not load route: ${p} — ${String(err.message || err)}`);
        return null;
    }
}
// note: paths are relative to this file's location. If you move this file, update the paths.
authRouter = tryRequire("./routes/auth");
bookingRoutes = tryRequire("./routes/booking");
counselorsRouter = tryRequire("./routes/counselor");
adminUsersRoutes = tryRequire("./routes/users");
sessionNotesRoutes = tryRequire("./routes/sessionNotes");
studentsRoutes = tryRequire("./routes/students");
adminUsersRouter = tryRequire("./routes/adminUsers");
adminAnalyticsRouter = tryRequire("./routes/adminAnalytics");
googleCalendarRoutes = tryRequire("./routes/googleCalendarRoutes");
studentProxy = tryRequire("./routes/studentProxy");
gamesRouter = tryRequire("./routes/games");
counselorSettingsRouter = tryRequire("./routes/counselorSettingsRoutes");
// allow cross-origin from your front-end with credentials
const CLIENT_ORIGIN = process.env.CLIENT_URL || "https://flamestudentcouncil.in:7070";
app.use((0, cors_1.default)({
    origin: CLIENT_ORIGIN,
    credentials: true,
}));
app.use(body_parser_1.default.json());
// Resolve public/uploads path robustly for both dev (src) and prod (dist)
const uploadsPath = [
    path_1.default.join(__dirname, "public/uploads"),
    path_1.default.join(__dirname, "../public/uploads"),
    path_1.default.join(process.cwd(), "public/uploads"),
    path_1.default.join(process.cwd(), "Backend/public/uploads"),
].find((p) => fs_1.default.existsSync(p));
if (uploadsPath) {
    console.log(`[app] Serving uploads from: ${uploadsPath}`);
    app.use("/uploads", express_1.default.static(uploadsPath));
}
else {
    console.warn("[app] Could not locate public/uploads directory!");
}
// ---------------------- API routes (register first) ----------------------
// Only mount a router if it loaded successfully, otherwise warn and skip.
if (authRouter)
    app.use("/api/auth", authRouter);
if (bookingRoutes)
    app.use("/api/bookings", bookingRoutes);
if (counselorsRouter)
    app.use("/api/counselors", counselorsRouter);
if (adminUsersRouter)
    app.use("/api/admin", adminUsersRouter);
if (adminUsersRoutes)
    app.use("/api/admin/users", adminUsersRoutes);
if (sessionNotesRoutes)
    app.use("/api/session-notes", sessionNotesRoutes);
if (studentsRoutes)
    app.use("/api/students", studentsRoutes);
if (adminAnalyticsRouter)
    app.use("/api/admin/analytics", adminAnalyticsRouter);
if (gamesRouter)
    app.use("/api/games", gamesRouter);
if (counselorSettingsRouter)
    app.use("/api/counselors/settings", counselorSettingsRouter);
// Google calendar routes (mounted on two endpoints historically for compatibility)
if (googleCalendarRoutes) {
    app.use("/api/google-calendar", googleCalendarRoutes);
    app.use("/api/counselors/google", googleCalendarRoutes);
}
if (studentProxy)
    app.use("/api", studentProxy);
// Compatibility shim used previously by frontend; keep it to avoid breaking older clients
app.get("/api/counselors/google/calendar", async (_req, res) => {
    return res.json({
        success: true,
        source: "compat-shim",
        internalBookings: [],
        counselor: null,
    });
});
// health
app.get("/health", (_req, res) => res.json({ ok: true }));
// Static client serving: candidates are evaluated relative to this file's directory
const buildCandidates = [
    path_1.default.join(__dirname, "..", "client", "dist"), // monorepo client/dist
    path_1.default.join(__dirname, "..", "client", "build"), // CRA convention
    path_1.default.join(__dirname, "..", "dist"), // simple root dist
    path_1.default.join(__dirname, "..", "public"), // fallback public
];
const clientBuildPath = buildCandidates.find((p) => fs_1.default.existsSync(p) && fs_1.default.statSync(p).isDirectory());
if (clientBuildPath) {
    // Serve static files
    app.use(express_1.default.static(clientBuildPath));
    // Fallback: for any route that doesn't start with /api serve index.html
    app.get("*", (req, res, next) => {
        // If it looks like an API route, pass through so 404s come from API handlers
        if (req.path.startsWith("/api"))
            return next();
        const indexHtml = path_1.default.join(clientBuildPath, "index.html");
        if (fs_1.default.existsSync(indexHtml)) {
            res.sendFile(indexHtml);
        }
        else {
            // If no index.html present for some reason, continue to next middleware
            next();
        }
    });
    console.log(`[app] Serving client from: ${clientBuildPath}`);
}
else {
    console.log("[app] No client build found; SPA fallback disabled. (This is fine during dev with Vite.)");
}
// ---------------------- Error handler ----------------------
app.use((err, _req, res, _next) => {
    console.error(err);
    const status = err?.status || 500;
    // ensure message is present and stringifiable
    const message = err?.message ?? (typeof err === "string" ? err : "Server error");
    res.status(status).json({ success: false, message });
});
exports.default = app;
