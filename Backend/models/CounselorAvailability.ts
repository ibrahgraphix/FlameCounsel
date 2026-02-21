export interface CounselorAvailability {
  id?: number;
  counselor_id: number;
  day_of_week: number; // 0 (Sunday) to 6 (Saturday)
  start_time: string;  // 'HH:mm:ss'
  end_time: string;    // 'HH:mm:ss'
  is_enabled: boolean;
}
