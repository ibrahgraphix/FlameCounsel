import express from "express";
import * as counselorSettingsController from "../controllers/counselorSettingsController";

const router = express.Router();

router.get("/:id", counselorSettingsController.getSettings);
router.post("/:id", counselorSettingsController.updateSettings);

export default router;
