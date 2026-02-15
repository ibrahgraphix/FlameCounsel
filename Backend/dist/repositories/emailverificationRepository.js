"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerificationRepository = void 0;
// src/repositories/emailVerificationRepository.ts
const db_1 = __importDefault(require("../config/db"));
const TABLE = "email_verification";
exports.emailVerificationRepository = {
    /**
     * Insert or update a code for an email.
     * If a row exists for the email it will be updated.
     */
    async upsertCode(email, code, expiresAt) {
        const q = `
      INSERT INTO ${TABLE} (email, code, expires_at, verified, created_at, updated_at)
      VALUES ($1, $2, $3, false, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE
        SET code = EXCLUDED.code,
            expires_at = EXCLUDED.expires_at,
            verified = false,
            verified_at = NULL,
            updated_at = NOW()
      RETURNING email, code, expires_at, verified, verified_at, created_at, updated_at
    `;
        const res = await db_1.default.query(q, [email, code, expiresAt]);
        return res.rows[0] ?? null;
    },
    async getByEmail(email) {
        const q = `SELECT email, code, expires_at, verified, verified_at, created_at, updated_at FROM ${TABLE} WHERE lower(email) = lower($1) LIMIT 1`;
        const res = await db_1.default.query(q, [email]);
        if (!res.rows || res.rows.length === 0)
            return null;
        return res.rows[0];
    },
    async markVerified(email) {
        const q = `
      UPDATE ${TABLE}
      SET verified = true,
          verified_at = NOW(),
          updated_at = NOW()
      WHERE lower(email) = lower($1)
      RETURNING email, code, expires_at, verified, verified_at, created_at, updated_at
    `;
        const res = await db_1.default.query(q, [email]);
        return res.rows[0] ?? null;
    },
    async deleteByEmail(email) {
        const q = `DELETE FROM ${TABLE} WHERE lower(email) = lower($1)`;
        const res = await db_1.default.query(q, [email]);
        return res.rowCount > 0;
    },
};
exports.default = exports.emailVerificationRepository;
