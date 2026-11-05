import pool from "../config/db";

export async function runMigrations() {
  try {
    console.log("[Migration] Checking database schema...");
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

        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='counselors' AND column_name='timezone'
        ) THEN
          ALTER TABLE counselors ADD COLUMN timezone VARCHAR(100) DEFAULT 'Asia/Kolkata';
        END IF;

        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='counselors' AND column_name='work_start_time'
        ) THEN
          ALTER TABLE counselors ADD COLUMN work_start_time VARCHAR(20) DEFAULT '09:00';
        END IF;

        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='counselors' AND column_name='work_end_time'
        ) THEN
          ALTER TABLE counselors ADD COLUMN work_end_time VARCHAR(20) DEFAULT '17:00';
        END IF;

        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='counselors' AND column_name='session_duration'
        ) THEN
          ALTER TABLE counselors ADD COLUMN session_duration INT DEFAULT 45;
        END IF;
      END
      $$;
    `);
    console.log("[Migration] Database schema is up to date.");
  } catch (err) {
    console.error("[Migration] Failed to run migrations:", err);
  }
}
