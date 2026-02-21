// src/controllers/counselorController.ts
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getAllCounselors,
  getCounselorById,
  updateProfile,
} from "../repositories/counselorRepository";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Multer configuration for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rootUploads = path.join(process.cwd(), "public/uploads");
    const uploadPath = path.join(rootUploads, "profile_pictures");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const counselorId = req.params.id;
    const ext = path.extname(file.originalname);
    cb(null, `counselor-${counselorId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"));
    }
  },
}).single("picture");

export const CounselorController = {
  async getAll(req: Request, res: Response) {
    try {
      const counselors = await getAllCounselors();
      // Return a consistent shape: { success: true, counselors: [...] }
      return res.json({ success: true, counselors });
    } catch (err: any) {
      console.error("CounselorController.getAll error:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id)
        return res.status(400).json({ success: false, error: "Invalid id" });
      const c = await getCounselorById(id);
      if (!c)
        return res.status(404).json({ success: false, error: "Not found" });
      return res.json({ success: true, counselor: c });
    } catch (err: any) {
      console.error("CounselorController.getById error:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, error: "Invalid id" });

      const { name, bio } = req.body;
      const updated = await updateProfile(id, { name, bio });
      if (!updated) {
        return res.status(404).json({ success: false, error: "Counselor not found or update failed" });
      }

      return res.json({ success: true, counselor: updated });
    } catch (err: any) {
      console.error("CounselorController.updateProfile error:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  },

  async uploadPicture(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid id" });

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }

      const mReq = req as MulterRequest;
      if (!mReq.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      try {
        // Construct the URL/path to store in DB
        const profilePicturePath = `/uploads/profile_pictures/${mReq.file.filename}`;

        // Get current picture to delete it if exists
        const current = await getCounselorById(id);
        if (current && current.profile_picture) {
          // Robust path resolution for deletion
          const relativePath = current.profile_picture.replace(/^\//, "").replace(/^uploads\//, "");
          const oldPath = path.join(process.cwd(), "public/uploads", relativePath);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const updated = await updateProfile(id, { profile_picture: profilePicturePath });
        if (!updated) {
          return res.status(404).json({ success: false, error: "Counselor not found" });
        }

        return res.json({ success: true, profile_picture: profilePicturePath, counselor: updated });
      } catch (dbErr) {
        console.error("CounselorController.uploadPicture DB error:", dbErr);
        return res.status(500).json({ success: false, error: "Database update failed" });
      }
    });
  },

  async deletePicture(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, error: "Invalid id" });

      const c = await getCounselorById(id);
      if (!c) return res.status(404).json({ success: false, error: "Not found" });

      if (c.profile_picture) {
        const relativePath = c.profile_picture.replace(/^\//, "").replace(/^uploads\//, "");
        const fullPath = path.join(process.cwd(), "public/uploads", relativePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const updated = await updateProfile(id, { profile_picture: "" }); // or null, but repo uses string
      return res.json({ success: true, counselor: updated });
    } catch (err: any) {
      console.error("CounselorController.deletePicture error:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  },
};
