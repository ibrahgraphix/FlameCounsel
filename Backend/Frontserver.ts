import express from "express";
import https from "https";
import path from "path";
import fs from "fs";
import { config } from "dotenv";

config();

const app = express();

const sslOptions = {
  cert: fs.readFileSync("/opt/View/sslcertificates/council_certificate.crt"),
  ca: fs.readFileSync("/opt/View/sslcertificates/council_bundle.crt"),
  key: fs.readFileSync("/opt/View/sslcertificates/council.key"),
};

// absolute path to Frontend/dist
const clientBuildPath = path.resolve(__dirname, "../../Frontend/dist");

console.log("[frontend] Serving client from:", clientBuildPath);

// 1️⃣ serve static FIRST
app.use(express.static(clientBuildPath));

// 2️⃣ health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// 3️⃣ SPA fallback ONLY for non-file routes
app.get("*", (req, res) => {
  // if request looks like a file (.js/.css/.png etc) → 404
  if (req.path.includes(".")) {
    return res.status(404).end();
  }

  res.sendFile(path.join(clientBuildPath, "index.html"));
});

const PORT = parseInt(process.env.FRONTEND_PORT || "7070", 10);

https.createServer(sslOptions, app).listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend server listening on https://flamestudentcouncil.in:${PORT}`);
});