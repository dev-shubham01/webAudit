import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import puppeteer from "puppeteer";

const getPerformanceFallback = () => ({
  performanceScore: 0,
  metrics: {
    fcp: null,
    lcp: null,
    cls: null,
  },
});

const toNumberOrNull = (value) => (Number.isFinite(value) ? value : null);

export async function analyzePerformance(url) {
  let chrome;

  try {
    const normalizedUrl = typeof url === "string" ? url.trim() : "";
    if (!normalizedUrl) {
      return getPerformanceFallback();
    }

    // Use Puppeteer's bundled Chromium path for reliable local Node execution.
    const chromePath = puppeteer.executablePath();

    chrome = await launch({
      chromePath,
      chromeFlags: [
        "--headless=new",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
    });

    const result = await lighthouse(normalizedUrl, {
      port: chrome.port,
      logLevel: "error",
      onlyCategories: ["performance"],
      emulatedFormFactor: "desktop",
    });

    const lhr = result?.lhr;
    const performanceScoreRaw = lhr?.categories?.performance?.score;
    const performanceScore = Number.isFinite(performanceScoreRaw)
      ? Math.round(performanceScoreRaw * 100)
      : 0;

    return {
      performanceScore,
      metrics: {
        fcp: toNumberOrNull(lhr?.audits?.["first-contentful-paint"]?.numericValue),
        lcp: toNumberOrNull(lhr?.audits?.["largest-contentful-paint"]?.numericValue),
        cls: toNumberOrNull(
          lhr?.audits?.["cumulative-layout-shift"]?.numericValue,
        ),
      },
    };
  } catch (error) {
    void error;
    return getPerformanceFallback();
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch (killError) {
        void killError;
      }
    }
  }
}
