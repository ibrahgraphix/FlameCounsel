"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounselorController = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const counselorRepository_1 = require("../repositories/counselorRepository");
// Multer configuration for profile picture upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, "../public/uploads/profile_pictures");
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const counselorId = req.params.id;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `counselor-${counselorId}-${Date.now()}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only JPEG, PNG and WebP images are allowed"));
        }
    },
}).single("picture");
exports.CounselorController = {
    async getAll(req, res) {
        try {
            const counselors = await (0, counselorRepository_1.getAllCounselors)();
            // Return a consistent shape: { success: true, counselors: [...] }
            return res.json({ success: true, counselors });
        }
        catch (err) {
            console.error("CounselorController.getAll error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    async getById(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id)
                return res.status(400).json({ success: false, error: "Invalid id" });
            const c = await (0, counselorRepository_1.getCounselorById)(id);
            if (!c)
                return res.status(404).json({ success: false, error: "Not found" });
            return res.json({ success: true, counselor: c });
        }
        catch (err) {
            console.error("CounselorController.getById error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    async updateProfile(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id)
                return res.status(400).json({ success: false, error: "Invalid id" });
            const { name, bio } = req.body;
            const updated = await (0, counselorRepository_1.updateProfile)(id, { name, bio });
            if (!updated) {
                return res.status(404).json({ success: false, error: "Counselor not found or update failed" });
            }
            return res.json({ success: true, counselor: updated });
        }
        catch (err) {
            console.error("CounselorController.updateProfile error:", err);
            return res.status(500).json({ success: false, error: "Server error" });
        }
    },
    async uploadPicture(req, res) {
        const id = Number(req.params.id);
        if (!id)
            return res.status(400).json({ success: false, error: "Invalid id" });
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, error: err.message });
            }
            const mReq = req;
            if (!mReq.file) {
                return res.status(400).json({ success: false, error: "No file uploaded" });
            }
            try {
                // Construct the URL/path to store in DB
                const profilePicturePath = `/uploads/profile_pictures/${mReq.file.filename}`;
                const updated = await (0, counselorRepository_1.updateProfile)(id, { profile_picture: profilePicturePath });
                if (!updated) {
                    return res.status(404).json({ success: false, error: "Counselor not found" });
                }
                return res.json({ success: true, profile_picture: profilePicturePath, counselor: updated });
            }
            catch (dbErr) {
                console.error("CounselorController.uploadPicture DB error:", dbErr);
                return res.status(500).json({ success: false, error: "Database update failed" });
            }
        });
    },
};
