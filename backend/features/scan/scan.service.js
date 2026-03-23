import { runPuppeteerScan } from "../puppeteer/puppeteer.service.js";
import { analyzePerformance } from "../lighthouse/lighthouse.service.js";

const getPerformanceFallback = () => ({
  performanceScore: 0,
  metrics: {
    fcp: null,
    lcp: null,
    cls: null,
  },
});

export async function runScan(url) {
  const scanResult = await runPuppeteerScan(url);

  let performance = getPerformanceFallback();
  try {
    performance = await analyzePerformance(url);
  } catch (error) {
    void error;
  }

  return {
    screenshot: scanResult?.screenshot || "",
    consoleErrors: Array.isArray(scanResult?.consoleErrors)
      ? scanResult.consoleErrors
      : [],
    networkErrors: Array.isArray(scanResult?.networkErrors)
      ? scanResult.networkErrors
      : [],
    seo: scanResult?.seo || {
      title: "Missing",
      metaDescription: "Missing",
      h1: { count: 0, texts: [] },
      images: { total: 0, missingAlt: 0 },
      links: { total: 0 },
    },
    performance,
  };
}
