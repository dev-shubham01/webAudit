import { buildCategories } from "./categories.js";

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function statusClass(status) {
  if (typeof status !== "number") return "other";
  if (status >= 200 && status < 300) return "2xx";
  if (status >= 300 && status < 400) return "3xx";
  if (status >= 400 && status < 500) return "4xx";
  if (status >= 500 && status < 600) return "5xx";
  return "other";
}

function toLinkRecord(p) {
  return {
    url: p.url,
    finalUrl: p.finalUrl,
    status: p.status,
    depth: p.depth,
    title: p.seo?.title || "",
    metaDescription: p.seo?.metaDescription || "",
    metaDescriptionLen: p.seo?.metaDescriptionLen || 0,
    canonicalUrl: p.seo?.canonicalUrl || "",
    h1Count: p.seo?.h1Count ?? 0,
    wordCount: p.seo?.wordCount ?? 0,
    readingLevel: p.seo?.readingLevel ?? 0,
    noindex: Boolean(p.seo?.noindex),
    viewportPresent: Boolean(p.seo?.viewportPresent),
    hasSchema: Boolean(p.seo?.hasSchema),
    imagesTotal: p.seo?.imagesTotal ?? 0,
    imagesWithoutAlt: p.seo?.imagesWithoutAlt ?? 0,
    ogTitle: p.seo?.ogTitle || "",
    twitterCard: p.seo?.twitterCard || "",
    techStack: p.techStack || [],
    responseTimeMs: p.responseTimeMs,
    contentLength: p.contentLength,
    redirectChainLength: p.redirectChainLength,
    warnings: p.pageAnalysis?.warnings || [],
    outlinksCount: p.outlinksCount,
    error: p.error,
  };
}

/**
 * Assemble the full report payload from a completed crawl. Mirrors the
 * shape reporting/builder.py's run_simple_report() produces, trimmed to
 * what Phase 1's Overview/Content pages read (docs/FEATURES.md).
 */
export function buildReport({ startUrl, pages, crawlTimeS, siteLevel }) {
  const categories = buildCategories(pages, { siteLevel, startUrl });

  const counts = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, other: 0 };
  for (const p of pages) counts[statusClass(p.status)] += 1;

  const totalUrls = pages.length;
  const successRate = totalUrls ? Math.round((counts["2xx"] / totalUrls) * 1000) / 10 : 0;

  const responseTimes = pages
    .map((p) => p.responseTimeMs)
    .filter((rt) => typeof rt === "number" && rt > 0)
    .sort((a, b) => a - b);
  const wordCounts = pages.map((p) => p.seo?.wordCount).filter((wc) => typeof wc === "number");
  const missingH1 = pages.filter((p) => (p.seo?.h1Count ?? -1) === 0).length;
  const ogPresent = pages.filter((p) => (p.seo?.ogTitle || "").trim()).length;

  const techSet = new Set();
  for (const p of pages) {
    for (const t of p.techStack || []) techSet.add(t);
  }

  const kpis = {
    totalUrls,
    successRate,
    brokenLinks: counts["4xx"] + counts["5xx"],
    missingH1,
    medianWordCount: Math.round(median(wordCounts)),
    ogCoveragePct: totalUrls ? Math.round((ogPresent / totalUrls) * 1000) / 10 : 0,
    techCount: techSet.size,
    responseTimeP50: Math.round(quantile(responseTimes, 0.5)),
    responseTimeP95: Math.round(quantile(responseTimes, 0.95)),
  };

  const recommendations = [...new Set(categories.flatMap((c) => c.recommendations))];

  const links = pages.map(toLinkRecord);

  // Phase 1 placeholder ranking (shallower pages first, then longer content).
  // Real inbound-link/PageRank-based ranking arrives in Phase 2 once the
  // link graph (edges/nodes) is built — see docs/ROADMAP.md.
  const topPages = links
    .filter((p) => typeof p.status === "number" && p.status < 400)
    .sort((a, b) => a.depth - b.depth || b.wordCount - a.wordCount)
    .slice(0, 15);

  return {
    siteName: new URL(startUrl).hostname,
    url: startUrl,
    generatedAt: new Date().toISOString(),
    summary: {
      totalUrls,
      count2xx: counts["2xx"],
      count3xx: counts["3xx"],
      count4xx: counts["4xx"],
      count5xx: counts["5xx"],
      successRate,
      crawlTimeS: Math.round(crawlTimeS * 10) / 10,
    },
    categories,
    kpis,
    recommendations,
    siteConfig: siteLevel,
    topPages,
    links,
  };
}
