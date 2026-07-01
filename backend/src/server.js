import express from "express";
import cors from "cors";
import { runScan } from "../features/scan/scan.service.js";
import { normalizeAndValidateUrl } from "./utils/urls.js";
import reportsRouter from "./jobs/job.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server running");
});

// New job-based crawl/report API (see docs/ARCHITECTURE.md §3).
app.use("/api/reports", reportsRouter);

// Legacy single-page scan endpoint, kept until the frontend Dashboard
// migrates to /api/reports in Phase 1 (see docs/ROADMAP.md).
const SCAN_TIMEOUT_MS = 120_000;

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("SCAN_TIMEOUT")), timeoutMs);
    }),
  ]);
}

app.post("/scan", async (req, res) => {
  try {
    const normalizedUrl = normalizeAndValidateUrl(req.body?.url);

    if (!normalizedUrl) {
      return res.status(400).json({
        success: false,
        message: "Scan failed",
      });
    }

    const scanResult = await withTimeout(runScan(normalizedUrl), SCAN_TIMEOUT_MS);
    return res.json(scanResult);
  } catch (error) {
    console.error("Scan endpoint error:", error);

    if (error?.message === "SCAN_TIMEOUT") {
      return res.status(504).json({
        success: false,
        message: "Scan timed out",
      });
    }

    return res.status(500).json({
      success: false,
      message: error?.message || "Scan failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
