import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import puppeteer from "puppeteer";
import { resolveImpact, parseLighthouseToDiagnostics } from "./warnings.js";

const CATEGORY_IDS = ["performance", "accessibility", "best-practices", "seo"];
const LCP_GOOD_MS = 2500;
const CLS_GOOD = 0.1;
const TBT_GOOD_MS = 200;

function evidenceFromAudit(audit) {
  const evidence = [];
  const details = audit.details;
  if (!details || typeof details !== "object") return evidence;
  const items = details.items || details.nodes || [];
  if (!Array.isArray(items)) return evidence;
  for (const item of items.slice(0, 5)) {
    if (item && typeof item === "object") {
      if (typeof item.url === "string" && !item.url.startsWith("data:")) evidence.push(item.url.slice(0, 500));
      const selector = item.node?.selector || item.selector;
      if (selector) evidence.push(String(selector).slice(0, 200));
    }
  }
  return evidence.slice(0, 15);
}

function extractFromLighthouseResult(lhr) {
  const audits = lhr.audits || {};
  const cats = lhr.categories || {};

  const metrics = {};
  for (const [auditId, key] of [
    ["largest-contentful-paint", "lcpMs"],
    ["cumulative-layout-shift", "cls"],
    ["total-blocking-time", "tbtMs"],
    ["first-contentful-paint", "fcpMs"],
    ["speed-index", "speedIndexMs"],
  ]) {
    const a = audits[auditId];
    if (a && typeof a.numericValue === "number") metrics[key] = a.numericValue;
  }

  const categoryScores = {};
  const rawScores = {};
  for (const [catId, key] of [
    ["performance", "performanceScore"],
    ["accessibility", "accessibilityScore"],
    ["seo", "seoScore"],
    ["best-practices", "bestPracticesScore"],
    ["pwa", "pwaScore"],
  ]) {
    const c = cats[catId];
    if (c && typeof c.score === "number") {
      rawScores[key] = c.score;
      categoryScores[catId] = Math.round(c.score * 100);
    }
  }

  const topFailures = Object.entries(audits)
    .filter(([, a]) => a && a.score != null && a.score < 1)
    .map(([auditId, a]) => ({
      id: auditId,
      score: a.score,
      helpText: a.helpText || "",
      impact: resolveImpact(auditId, a.title, a.helpText),
      evidence: evidenceFromAudit(a),
    }))
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 10);

  return { metrics, categoryScores, rawScores, topFailures };
}

function buildHumanSummary(metrics) {
  const parts = [];
  if (metrics.lcpMs != null) {
    parts.push(`LCP ${metrics.lcpMs <= LCP_GOOD_MS ? "meets" : "exceeds"} good threshold (≤${LCP_GOOD_MS}ms).`);
  }
  if (metrics.cls != null) {
    parts.push(`CLS ${metrics.cls <= CLS_GOOD ? "meets" : "exceeds"} good threshold (≤${CLS_GOOD}).`);
  }
  if (metrics.tbtMs != null) {
    parts.push(`TBT ${metrics.tbtMs <= TBT_GOOD_MS ? "meets" : "exceeds"} good threshold (≤${TBT_GOOD_MS}ms).`);
  }
  return parts.length ? parts.join(" ") : "No Core Web Vitals metrics extracted.";
}

async function launchChrome() {
  return launch({
    chromePath: puppeteer.executablePath(),
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
}

/**
 * Run Lighthouse once for a URL. Mirrors the reference's run_lighthouse_audit()
 * output shape (median_metrics/category_scores/top_failures/diagnostics/
 * human_summary), lifted from the existing chrome-launcher pattern in
 * backend/features/lighthouse/lighthouse.service.js and extended to full
 * categories instead of performance-only.
 */
export async function runLighthouseForUrl(url, { strategy = "mobile", categories = CATEGORY_IDS } = {}) {
  let chrome;
  try {
    chrome = await launchChrome();
    const result = await lighthouse(url, {
      port: chrome.port,
      logLevel: "error",
      onlyCategories: categories,
      emulatedFormFactor: strategy === "desktop" ? "desktop" : "mobile",
    });

    const lhr = result?.lhr;
    if (!lhr) throw new Error("Lighthouse returned no result");

    const { metrics, categoryScores, rawScores, topFailures } = extractFromLighthouseResult(lhr);

    return {
      url,
      strategy,
      device: strategy,
      mode: "navigation",
      categories,
      iterations: 1,
      medianMetrics: { ...metrics, ...rawScores },
      categoryScores,
      topFailures,
      diagnostics: parseLighthouseToDiagnostics(lhr).slice(0, 15),
      humanSummary: buildHumanSummary(metrics),
      runTimestamp: new Date().toISOString(),
      audits: Object.entries(lhr.audits || {}).map(([id, a]) => ({
        id,
        title: a.title,
        description: a.description,
        score: a.score,
        displayValue: a.displayValue,
        helpText: a.helpText,
        details: a.details,
      })),
    };
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Run Lighthouse across multiple URLs sequentially — each run needs its own
 * Chrome instance, so parallelizing isn't worth the resource contention on a
 * dev machine. A failure on one URL doesn't stop the rest (mirrors
 * run_lighthouse_on_pages).
 */
export async function runLighthouseOnPages(urls, options = {}, hooks = {}) {
  const byUrl = {};
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    try {
      byUrl[url] = await runLighthouseForUrl(url, options);
    } catch (error) {
      console.error(`Lighthouse failed for ${url}:`, error?.message || error);
    }
    hooks.onProgress?.({ pagesTested: i + 1, pagesTotal: urls.length });
  }
  return byUrl;
}
