import { runPuppeteerScan } from "../puppeteer/puppeteer.service.js";
import { analyzePerformance } from "../lighthouse/lighthouse.service.js";
import { calculateScore } from "../../utils/scoring.js";

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

  const consoleErrors = Array.isArray(scanResult?.consoleErrors)
    ? scanResult.consoleErrors
    : [];
  const networkErrors = Array.isArray(scanResult?.networkErrors)
    ? scanResult.networkErrors
    : [];
  const isBlocked = Boolean(scanResult?.isBlocked);

  if (isBlocked) {
    return {
      isBlocked: true,
      message: "Website blocked automated access",
      screenshot: scanResult?.screenshot ?? null,
      consoleErrors,
      networkErrors,
      performance,
      seo: null,
    };
  }

  const seo = scanResult?.seo || {
    title: "Missing",
    metaDescription: "Missing",
    h1: { count: 0, texts: [] },
    images: { total: 0, missingAlt: 0 },
    links: { total: 0 },
    canonical: "Missing",
    openGraph: {
      title: "Missing",
      description: "Missing",
      image: "Missing",
    },
  };
  const links = scanResult?.links || {
    totalLinks: 0,
    checkedLinks: 0,
    brokenLinks: [],
    successCount: 0,
    unknownLinks: [],
  };

  let score = null;
  try {
    const normalizedSeo = {
      hasTitle: typeof seo?.title === "string" && seo.title.trim() !== "" && seo.title !== "Missing",
      hasMetaDescription:
        typeof seo?.metaDescription === "string" &&
        seo.metaDescription.trim() !== "" &&
        seo.metaDescription !== "Missing",
      hasCanonical:
        typeof seo?.canonical === "string" &&
        seo.canonical.trim() !== "" &&
        seo.canonical !== "Missing",
      hasOgTitle:
        typeof seo?.openGraph?.title === "string" &&
        seo.openGraph.title.trim() !== "" &&
        seo.openGraph.title !== "Missing",
      hasOgDescription:
        typeof seo?.openGraph?.description === "string" &&
        seo.openGraph.description.trim() !== "" &&
        seo.openGraph.description !== "Missing",
      hasOgImage:
        typeof seo?.openGraph?.image === "string" &&
        seo.openGraph.image.trim() !== "" &&
        seo.openGraph.image !== "Missing",
      h1Count: Number(seo?.h1?.count) || 0,
      totalImages: Number(seo?.images?.total) || 0,
      missingAlt: Number(seo?.images?.missingAlt) || 0,
    };

    score = calculateScore({
      seo: normalizedSeo,
      performance,
      consoleErrors,
      networkErrors,
    });
  } catch (error) {
    void error;
    score = null;
  }

  return {
    screenshot: scanResult?.screenshot ?? null,
    consoleErrors,
    networkErrors,
    seo,
    performance,
    score,
    insights: null,
    links,
  };
}
