import counselorSettingsRepository from "../repositories/counselorSettingsRepository";
import { CounselorAvailability } from "../models/CounselorAvailability";

const getSettings = async (counselorId: number) => {
  const [availability, sessionDuration] = await Promise.all([
    counselorSettingsRepository.getCounselorAvailability(counselorId),
    counselorSettingsRepository.getSessionDuration(counselorId)
  ]);

  return { availability, sessionDuration };
};

const updateSettings = async (
  counselorId: number,
  data: { availability: CounselorAvailability[]; sessionDuration: number }
) => {
  await Promise.all([
    counselorSettingsRepository.updateCounselorAvailability(counselorId, data.availability),
    counselorSettingsRepository.updateSessionDuration(counselorId, data.sessionDuration)
  ]);
  return { success: true };
};

export default {
  getSettings,
  updateSettings
};
