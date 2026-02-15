"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = void 0;
const service = __importStar(require("../services/adminAnalytics"));
/**
 * ensureAdminOrCounselor
 * Validates that req.user exists and has role admin or counselor.
 */
const ensureAdminOrCounselor = (req) => {
    const u = req.user;
    if (!u)
        return false;
    const role = String(u.role ?? "").toLowerCase();
    return role === "admin" || role === "counselor";
};
/**
 * GET /api/admin/analytics
 *
 * Behavior:
 * - If requester is admin -> return global analytics (system-wide).
 * - If requester is counselor -> return analytics scoped to that counselor (uses req.user.id).
 *
 * Note: Frontend does NOT need to pass any query param. Authorization is enforced server-side.
 */
const getAnalytics = async (req, res) => {
    try {
        if (!ensureAdminOrCounselor(req)) {
            return res.status(403).json({ success: false, error: "Forbidden" });
        }
        const user = req.user || {};
        const role = String(user.role ?? "").toLowerCase();
        // If counselor, scope to their id. If admin, no scoping (system-wide).
        if (role === "counselor") {
            const counselorId = user.id ?? user.counselor_id ?? user.userId;
            if (!counselorId) {
                return res
                    .status(400)
                    .json({ success: false, error: "Counselor id not found in token" });
            }
            const analytics = await service.fetchSystemAnalytics({ counselorId });
            return res.json({ success: true, analytics });
        }
        else {
            // Admin: return full analytics
            const analytics = await service.fetchSystemAnalytics();
            return res.json({ success: true, analytics });
        }
    }
    catch (err) {
        console.error("admin.getAnalytics error:", err);
        return res
            .status(500)
            .json({ success: false, error: err.message ?? "Server error" });
    }
};
exports.getAnalytics = getAnalytics;
exports.default = { getAnalytics: exports.getAnalytics };
