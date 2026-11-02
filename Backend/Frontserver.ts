import express from "express";
import https from "https";
import path from "path";
import fs from "fs";
import { config } from "dotenv";

config();

const app = express();

const sslCertPath =
  process.env.SSL_CERT_PATH || "/opt/View/sslcertificates/council_certificate.crt";
const sslCaPath =
  process.env.SSL_CA_PATH || "/opt/View/sslcertificates/council_bundle.crt";
const sslKeyPath =
  process.env.SSL_KEY_PATH || "/opt/View/sslcertificates/council.key";

const sslOptions: https.ServerOptions = {
  cert: fs.existsSync(sslCertPath) ? fs.readFileSync(sslCertPath) : undefined,
  ca: fs.existsSync(sslCaPath) ? fs.readFileSync(sslCaPath) : undefined,
  key: fs.existsSync(sslKeyPath) ? fs.readFileSync(sslKeyPath) : undefined,
};

// absolute path to Frontend/dist
const clientBuildPath = path.resolve(__dirname, "../../Frontend/dist");

console.log("[frontend] Serving client from:", clientBuildPath);

// 1️⃣ serve static FIRST
app.use(express.static(clientBuildPath));

// 1.5 serve /uploads so pictures show up if this server is port 7070
const possibleUploads = [
  path.join(process.cwd(), "public/uploads"),
  path.join(process.cwd(), "Backend/public/uploads"),
  path.join(__dirname, "public/uploads"),
  path.join(__dirname, "../public/uploads"),
];
const rootUploads = possibleUploads.find(p => {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch { return false; }
}) || path.join(process.cwd(), "public/uploads");

console.log("[frontend] Serving /uploads from:", rootUploads);
app.use("/uploads", express.static(rootUploads));


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
const DOMAIN =
  process.env.FRONTEND_ORIGIN ||
  process.env.CLIENT_URL ||
  "https://flamewellbeing.work.gd";

https.createServer(sslOptions, app).listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend server listening on ${DOMAIN}:${PORT}`);
});
