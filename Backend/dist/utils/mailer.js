"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
// src/utils/mailer.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE, EMAIL_SERVICE, EMAIL_FROM, } = process.env;
let transporter = null;
const createTransporter = () => {
    try {
        if (EMAIL_SERVICE) {
            return nodemailer_1.default.createTransport({
                service: EMAIL_SERVICE,
                auth: {
                    user: EMAIL_USER,
                    pass: EMAIL_PASS,
                },
            });
        }
        if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
            const port = EMAIL_PORT ? Number(EMAIL_PORT) : undefined;
            const secure = EMAIL_SECURE === "true" || EMAIL_SECURE === "1";
            return nodemailer_1.default.createTransport({
                host: EMAIL_HOST,
                port,
                secure,
                auth: {
                    user: EMAIL_USER,
                    pass: EMAIL_PASS,
                },
            });
        }
        // Try sendmail as last resort (local)
        return nodemailer_1.default.createTransport({ sendmail: true });
    }
    catch (err) {
        console.warn("createTransporter error:", err);
        return null;
    }
};
transporter = createTransporter();
const sendMail = async (opts) => {
    const from = opts.from ?? EMAIL_FROM ?? EMAIL_USER ?? `no-reply@example.com`;
    if (!transporter) {
        // transporter not configured — log for dev and return null
        console.warn(`Mailer not configured. Pretending to send email to ${opts.to}. Subject: ${opts.subject}\nText: ${opts.text}`);
        // For local dev it's useful to still return a pseudo-info object
        return null;
    }
    try {
        const info = await transporter.sendMail({
            from,
            to: opts.to,
            subject: opts.subject,
            text: opts.text,
            html: opts.html,
        });
        return info;
    }
    catch (err) {
        console.error("sendMail error:", err);
        throw err;
    }
};
exports.sendMail = sendMail;
exports.default = { sendMail: exports.sendMail };
