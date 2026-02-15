"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounselorController = void 0;
const counselorRepository_1 = require("../repositories/counselorRepository");
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
};
