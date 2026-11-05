import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { config } from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

config();

const app = express();

const BACKEND_URL =
  process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:4000";

// 1️⃣ Route /api and /socket.io requests to backend (with WebSocket support)
const backendProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  pathFilter: ["/api", "/socket.io"],
});
app.use(backendProxy);

// absolute path to Frontend/dist
const clientBuildPath = path.resolve(__dirname, "../../Frontend/dist");

console.log("[frontend] Serving client from:", clientBuildPath);

// 2️⃣ serve static FIRST
app.use(express.static(clientBuildPath));

// 2.5 serve /uploads so pictures show up if this server is port 7070
const possibleUploads = [
  path.join(process.cwd(), "public/uploads"),
  path.join(process.cwd(), "Backend/public/uploads"),
  path.join(__dirname, "public/uploads"),
  path.join(__dirname, "../public/uploads"),
];
const rootUploads =
  possibleUploads.find((p) => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  }) || path.join(process.cwd(), "public/uploads");

console.log("[frontend] Serving /uploads from:", rootUploads);
app.use("/uploads", express.static(rootUploads));

// 3️⃣ health check
app.get("/health", (_req, res) => res.json({ ok: true, service: "frontend" }));

// 4️⃣ SPA fallback ONLY for non-file routes
app.get("*", (req, res) => {
  // if request looks like a file (.js/.css/.png etc) → 404
  if (req.path.includes(".")) {
    return res.status(404).end();
  }

  res.sendFile(path.join(clientBuildPath, "index.html"));
});

const PORT = parseInt(process.env.FRONTEND_PORT || "7070", 10);
const HOST = process.env.HOST || "localhost";

const server = http.createServer(app);

// WebSocket upgrade handling for socket.io
server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.startsWith("/socket.io")) {
    backendProxy.upgrade(req, socket as any, head);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Frontend server listening on http://${HOST}:${PORT}`);
});
