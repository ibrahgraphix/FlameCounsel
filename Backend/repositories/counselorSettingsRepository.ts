import pool from "../config/db";
import { CounselorAvailability } from "../models/CounselorAvailability";

export const getCounselorAvailability = async (counselorId: number): Promise<CounselorAvailability[]> => {
  const res = await pool.query(
    "SELECT * FROM counselor_availability WHERE counselor_id = $1 ORDER BY day_of_week",
    [counselorId]
  );
  return res.rows;
};

export const updateCounselorAvailability = async (
  counselorId: number,
  availabilities: CounselorAvailability[]
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Delete existing availability for this counselor
    await client.query("DELETE FROM counselor_availability WHERE counselor_id = $1", [counselorId]);
    
    // Insert new availabilities
    for (const av of availabilities) {
      if (av.is_enabled) {
        await client.query(
          "INSERT INTO counselor_availability (counselor_id, day_of_week, start_time, end_time, is_enabled) VALUES ($1, $2, $3, $4, $5)",
          [counselorId, av.day_of_week, av.start_time, av.end_time, av.is_enabled]
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateSessionDuration = async (counselorId: number, duration: number): Promise<void> => {
  await pool.query(
    "UPDATE counselors SET session_duration = $1 WHERE counselor_id = $2",
    [duration, counselorId]
  );
};

export const getSessionDuration = async (counselorId: number): Promise<number> => {
  const res = await pool.query(
    "SELECT session_duration FROM counselors WHERE counselor_id = $1",
    [counselorId]
  );
  return res.rows[0]?.session_duration ?? 60;
};

export default {
  getCounselorAvailability,
  updateCounselorAvailability,
  updateSessionDuration,
  getSessionDuration
};
