// src/routes/counselor.ts
import express from "express";
import { CounselorController } from "../controllers/counselorController";

const router = express.Router();

// GET /api/counselors
router.get("/", CounselorController.getAll);

// GET /api/counselors/:id
router.get("/:id", CounselorController.getById);

// PATCH /api/counselors/:id/profile
router.patch("/:id/profile", CounselorController.updateProfile);

// POST /api/counselors/:id/upload-picture
router.post("/:id/upload-picture", CounselorController.uploadPicture);

// DELETE /api/counselors/:id/picture
router.delete("/:id/picture", CounselorController.deletePicture);

export default router;
