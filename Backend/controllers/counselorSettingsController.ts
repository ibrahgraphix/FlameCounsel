import { Request, Response } from "express";
import counselorSettingsService from "../services/counselorSettingsService";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const counselorId = Number(req.params.id);
    if (!counselorId) return res.status(400).json({ error: "Counselor ID required" });
    
    const settings = await counselorSettingsService.getSettings(counselorId);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const counselorId = Number(req.params.id);
    if (!counselorId) return res.status(400).json({ error: "Counselor ID required" });
    
    const { availability, sessionDuration } = req.body;
    await counselorSettingsService.updateSettings(counselorId, { availability, sessionDuration });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
