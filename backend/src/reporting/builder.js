import { buildCategories } from "./categories.js";
import { computeInDegree, buildGraphPayload } from "../graph/linkGraph.js";

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

function toLinkRecord(p, inDegree) {
  return {
    url: p.url,
    finalUrl: p.finalUrl,
    status: p.status,
    depth: p.depth,
    contentType: p.contentType || "",
    title: p.seo?.title || "",
    metaDescription: p.seo?.metaDescription || "",
    metaDescriptionLen: p.seo?.metaDescriptionLen || 0,
    canonicalUrl: p.seo?.canonicalUrl || "",
    h1Count: p.seo?.h1Count ?? 0,
    h1Text: p.seo?.h1Text || "",
    wordCount: p.seo?.wordCount ?? 0,
    readingLevel: p.seo?.readingLevel ?? 0,
    contentHtmlRatio: p.seo?.contentHtmlRatio ?? 0,
    topKeywords: p.seo?.topKeywords || [],
    contentFingerprint: p.seo?.contentFingerprint || "0",
    language: p.seo?.language || "und",
    noindex: Boolean(p.seo?.noindex),
    viewportPresent: Boolean(p.seo?.viewportPresent),
    hasSchema: Boolean(p.seo?.hasSchema),
    imagesTotal: p.seo?.imagesTotal ?? 0,
    imagesWithoutAlt: p.seo?.imagesWithoutAlt ?? 0,
    ogTitle: p.seo?.ogTitle || "",
    ogDescription: p.seo?.ogDescription || "",
    ogImage: p.seo?.ogImage || "",
    twitterCard: p.seo?.twitterCard || "",
    twitterImage: p.seo?.twitterImage || "",
    techStack: p.techStack || [],
    responseTimeMs: p.responseTimeMs,
    contentLength: p.contentLength,
    redirectChainLength: p.redirectChainLength,
    headers: p.headers || {},
    pageAnalysis: p.pageAnalysis || null,
    warnings: p.pageAnalysis?.warnings || [],
    outlinksCount: p.outlinksCount,
    inlinksCount: inDegree.get(p.finalUrl) ?? inDegree.get(p.url) ?? 0,
    error: p.error,
  };
}

/**
 * Assemble the full report payload from a completed crawl. Mirrors the
 * shape reporting/builder.py's run_simple_report() produces, extended in
 * Phase 2 with the internal link graph and outlink-checking results
 * (docs/FEATURES.md).
 */
export function buildReport({
  startUrl,
  pages,
  crawlTimeS,
  siteLevel,
  edges = [],
  externalLinkChecks = [],
  lighthouseByUrl = {},
  securityFindings = [],
  mlBundle = null,
}) {
  const inDegree = computeInDegree(edges);
  const externalBrokenLinks = externalLinkChecks.filter((l) => l.result === "broken");
  const unknownLinks = externalLinkChecks.filter((l) => l.result === "unknown");

  // Site-level summary defaults to whichever tested page comes first in
  // crawl order (normally the homepage) — mirrors the reference's fallback
  // of `data.lighthouse_summary` when no per-URL selection is active.
  const lighthouseUrls = Object.keys(lighthouseByUrl);
  const lighthouseSummary = lighthouseUrls.length ? lighthouseByUrl[lighthouseUrls[0]] : null;

  const categories = buildCategories(pages, {
    siteLevel,
    startUrl,
    edges,
    externalBrokenLinks,
    lighthouseSummary,
    securityFindings,
    mlBundle,
  });

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
    brokenLinks: counts["4xx"] + counts["5xx"] + externalBrokenLinks.length,
    missingH1,
    medianWordCount: Math.round(median(wordCounts)),
    ogCoveragePct: totalUrls ? Math.round((ogPresent / totalUrls) * 1000) / 10 : 0,
    techCount: techSet.size,
    responseTimeP50: Math.round(quantile(responseTimes, 0.5)),
    responseTimeP95: Math.round(quantile(responseTimes, 0.95)),
  };

  const recommendations = [...new Set(categories.flatMap((c) => c.recommendations))];

  const links = pages.map((p) => toLinkRecord(p, inDegree));

  // Inbound-link-based ranking (real PageRank-style graph, not the Phase 1
  // depth placeholder) now that the internal link graph is built.
  const topPages = links
    .filter((p) => typeof p.status === "number" && p.status < 400)
    .sort((a, b) => b.inlinksCount - a.inlinksCount || b.wordCount - a.wordCount)
    .slice(0, 15);

  const redirects = pages
    .filter((p) => (p.redirectChainLength || 0) > 0)
    .map((p) => ({ url: p.url, status: p.status, finalUrl: p.finalUrl, redirectChainLength: p.redirectChainLength }));

  const brokenLinks = [
    ...pages
      .filter((p) => (typeof p.status === "number" && p.status >= 400) || p.status === "error")
      .map((p) => ({ url: p.url, status: p.status, source: "crawled" })),
    ...externalBrokenLinks.map((l) => ({ url: l.url, status: l.status, source: "external" })),
  ];

  const graphPayload = buildGraphPayload(pages, edges);

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
    redirects,
    brokenLinks,
    unknownLinks,
    lighthouseByUrl,
    lighthouseSummary,
    lighthouseHumanSummary: lighthouseSummary?.humanSummary || "",
    lighthouseDiagnostics: lighthouseSummary?.diagnostics || [],
    securityFindings,
    contentDuplicates: mlBundle?.contentDuplicates || [],
    languageSummary: mlBundle?.languageSummary || { mixedSite: false, detectedPages: 0, counts: {} },
    anomalies: mlBundle?.anomalies || [],
    graphNodes: graphPayload.nodes,
    graphEdges: graphPayload.edges,
  };
}
