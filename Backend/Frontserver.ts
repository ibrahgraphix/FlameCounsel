import express from "express";
import https from "https";
import path from "path";
import fs from "fs";
import { config } from "dotenv";

config();

const app = express();

const defaultCertPath = fs.existsSync(
  "/etc/letsencrypt/live/flamewellbeing.in/fullchain.pem"
)
  ? "/etc/letsencrypt/live/flamewellbeing.in/fullchain.pem"
  : fs.existsSync("/opt/View/sslcertificates/council_certificate.crt")
  ? "/opt/View/sslcertificates/council_certificate.crt"
  : undefined;

const defaultKeyPath = fs.existsSync(
  "/etc/letsencrypt/live/flamewellbeing.in/privkey.pem"
)
  ? "/etc/letsencrypt/live/flamewellbeing.in/privkey.pem"
  : fs.existsSync("/opt/View/sslcertificates/council.key")
  ? "/opt/View/sslcertificates/council.key"
  : undefined;

const sslCertPath = process.env.SSL_CERT_PATH || defaultCertPath;
const sslCaPath = process.env.SSL_CA_PATH;
const sslKeyPath = process.env.SSL_KEY_PATH || defaultKeyPath;

const sslOptions: https.ServerOptions = {
  cert: sslCertPath && fs.existsSync(sslCertPath) ? fs.readFileSync(sslCertPath) : undefined,
  ca: sslCaPath && fs.existsSync(sslCaPath) ? fs.readFileSync(sslCaPath) : undefined,
  key: sslKeyPath && fs.existsSync(sslKeyPath) ? fs.readFileSync(sslKeyPath) : undefined,
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
  "https://flamewellbeing.in";

https.createServer(sslOptions, app).listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend server listening on ${DOMAIN}:${PORT}`);
});
