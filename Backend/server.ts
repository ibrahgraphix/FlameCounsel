// server.ts
import app from "./app";
import dotenv from "dotenv";
import https from "https";
import fs from "fs";
import { runMigrations } from "./utils/migration";
import bookingService from "./services/bookingService";

dotenv.config();

// Run DB migrations on startup
runMigrations();

// ---- Auto-close expired pending bookings ----
// Run immediately on startup, then every 5 minutes.
const runExpiredBookingsJob = async () => {
  try {
    const count = await bookingService.closePendingExpiredBookings();
    if (count > 0) {
      console.log(`[Server] Expired-bookings job: closed ${count} booking(s).`);
    }
  } catch (err) {
    console.error("[Server] Expired-bookings job error:", err);
  }
};

runExpiredBookingsJob();
setInterval(runExpiredBookingsJob, 5 * 60 * 1000); // every 5 minutes

// Load SSL certificates
const defaultCertPath = fs.existsSync(
  "/etc/letsencrypt/live/flamewellbeing.work.gd/fullchain.pem"
)
  ? "/etc/letsencrypt/live/flamewellbeing.work.gd/fullchain.pem"
  : "/opt/View/sslcertificates/council_certificate.crt";

const defaultKeyPath = fs.existsSync(
  "/etc/letsencrypt/live/flamewellbeing.work.gd/privkey.pem"
)
  ? "/etc/letsencrypt/live/flamewellbeing.work.gd/privkey.pem"
  : "/opt/View/sslcertificates/council.key";

const sslCertPath = process.env.SSL_CERT_PATH || defaultCertPath;
const sslCaPath = process.env.SSL_CA_PATH;
const sslKeyPath = process.env.SSL_KEY_PATH || defaultKeyPath;

const sslOptions: https.ServerOptions = {
  cert: fs.existsSync(sslCertPath) ? fs.readFileSync(sslCertPath) : undefined,
  ca: sslCaPath && fs.existsSync(sslCaPath) ? fs.readFileSync(sslCaPath) : undefined,
  key: fs.existsSync(sslKeyPath) ? fs.readFileSync(sslKeyPath) : undefined,
};

const PORT = process.env.PORT || 4000;
const DOMAIN = process.env.BACKEND_URL || "https://flamewellbeing.work.gd";
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server listening on ${DOMAIN}:${PORT}`);
});
