// src/config/db.ts
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

const { Pool } = require("pg");

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : "",
  database: process.env.DB_NAME,
});

// default export kept for any code that expects default
export default pool;
