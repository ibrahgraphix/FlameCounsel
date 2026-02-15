"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
// Load SSL certificates
const sslOptions = {
    cert: fs_1.default.readFileSync("/opt/View/sslcertificates/council_certificate.crt"),
    ca: fs_1.default.readFileSync("/opt/View/sslcertificates/council_bundle.crt"),
    key: fs_1.default.readFileSync("/opt/View/sslcertificates/council.key"),
};
const PORT = process.env.PORT || 4000;
https_1.default.createServer(sslOptions, app_1.default).listen(PORT, () => {
    console.log(`Server listening on https://flamestudentcouncil.in:${PORT}`);
});
