import pool from "../config/db";

export async function runMigrations() {
  try {
    console.log("[Migration] Checking database schema...");
    // Add google_event_id to bookings if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='bookings' AND column_name='google_event_id'
        ) THEN
          ALTER TABLE bookings ADD COLUMN google_event_id VARCHAR(255);
        END IF;
      END
      $$;
    `);
    console.log("[Migration] Database schema is up to date.");
  } catch (err) {
    console.error("[Migration] Failed to run migrations:", err);
  }
}
