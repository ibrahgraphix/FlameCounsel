// src/routes/studentProxy.ts
import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

const STUDENT_API_BASE =
  process.env.STUDENT_API_BASE || "https://studenttracking.in/api/employee";

const AXIOS_TIMEOUT_MS = Number(process.env.STUDENT_PROXY_TIMEOUT_MS) || 8_000;

router.get("/student-lookup", async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code ?? "").trim();
    if (!code) {
      return res
        .status(400)
        .json({ message: "query parameter `code` is required" });
    }

    // Build upstream URL (simple GET with ?code=...)
    const upstreamUrl = `${STUDENT_API_BASE}?code=${encodeURIComponent(code)}`;

    console.log(`[student-lookup] Proxying to: ${upstreamUrl}`);

    // Server-to-server fetch — avoids browser CORS restrictions
    const response = await axios.get(upstreamUrl, {
      timeout: AXIOS_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
      },
      responseType: "json",
    });

    // Forward upstream status & JSON body directly
    return res.status(response.status).json(response.data);
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 502;
      const data = err.response?.data ?? { message: err.message };

      const isTimeout =
        err.code === "ECONNABORTED" || (err.message ?? "").includes("timeout");
      const isUnreachable =
        err.code === "ECONNREFUSED" ||
        err.code === "ENOTFOUND" ||
        err.code === "ETIMEDOUT" ||
        err.code === "EHOSTUNREACH";

      const friendlyMessage = isTimeout
        ? "Student lookup service timed out. Please enter your details manually."
        : isUnreachable
        ? "Student lookup service is currently unavailable. Please enter your details manually."
        : `Student lookup returned an error (${status}). Please enter your details manually.`;

      console.warn(
        "[student-lookup] proxy error:",
        err.code ?? err.message,
        "upstreamStatus:",
        status
      );

      // Always return 503 (service unavailable) so frontend handles it cleanly
      return res.status(503).json({
        proxied: true,
        unavailable: true,
        friendlyMessage,
        upstreamStatus: status,
        upstreamData: data,
      });
    }

    console.error("[student-lookup] unexpected error:", err);
    return res.status(503).json({
      proxied: true,
      unavailable: true,
      friendlyMessage:
        "Internal server error during student lookup. Please enter your details manually.",
    });
  }
});

export default router;

