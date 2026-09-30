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
const sslOptions = {
  cert: fs.readFileSync("/opt/View/sslcertificates/council_certificate.crt"),
  ca: fs.readFileSync("/opt/View/sslcertificates/council_bundle.crt"),
  key: fs.readFileSync("/opt/View/sslcertificates/council.key"),
};

const PORT = process.env.PORT || 4000;
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server listening on https://flamestudentcouncil.in:${PORT}`);
});
