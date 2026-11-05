// server.ts
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envCandidates = [
  path.resolve(process.cwd(), "Backend/.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), ".env"),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { runMigrations } from "./utils/migration";
import bookingService from "./services/bookingService";

// ---- Auto-close expired pending bookings ----
// Run immediately on startup (after migrations), then every 5 minutes.
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

(async () => {
  await runMigrations();
  await runExpiredBookingsJob();
  setInterval(runExpiredBookingsJob, 5 * 60 * 1000); // every 5 minutes
})();

const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "localhost";

const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io/",
});

io.on("connection", (socket: import("socket.io").Socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Backend server listening on http://${HOST}:${PORT}`);
});

export { io, server };
