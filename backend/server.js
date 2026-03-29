  import express from "express";
import cors from "cors";
import { runScan } from "./features/scan/scan.service.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Flipkart/large sites often take longer than 30s (Puppeteer + Lighthouse).
// If this is too low, the endpoint throws and we return a generic 500.
const SCAN_TIMEOUT_MS = 120_000;

function normalizeAndValidateUrl(rawUrl) {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch (_error) {
    return null;
  }
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("SCAN_TIMEOUT")), timeoutMs);
    }),
  ]);
}

app.get("/", (req, res) => {
  res.send("Server running");
});

app.post("/scan", async (req, res) => {
  try {
    const { url } = req.body;
    const normalizedUrl = normalizeAndValidateUrl(url);

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
