// Client-side aggregation of report.data.links into the same shapes the
// reference computes server-side in reporting/builder.py's _build_content_analytics /
// _build_social_coverage / _build_response_time_stats / _build_hreflang_summary /
// _build_outbound_link_domains. All inputs (wordCount, readingLevel, etc.) are
// already in the report payload since Phase 1-2, so no backend work was needed
// for these — see docs/ROADMAP.md Phase 6.

const TITLE_LEN_MIN = 30;
const TITLE_LEN_MAX = 60;
const META_DESC_LEN_MIN = 70;
const META_DESC_LEN_MAX = 160;
const THIN_CONTENT_CHARS = 300;

function quantile(sortedValues, q) {
  if (!sortedValues.length) return 0;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sortedValues[base + 1] !== undefined
    ? sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base])
    : sortedValues[base];
}

function median(sortedValues) {
  if (!sortedValues.length) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

function isSuccess(p) {
  return typeof p.status === "number" && p.status >= 200 && p.status < 300;
}

export function wordCountStats(links) {
  const wc = links.filter(isSuccess).map((p) => p.wordCount || 0).sort((a, b) => a - b);
  if (!wc.length) return { mean: 0, median: 0, p25: 0, p75: 0, min: 0, max: 0 };
  const mean = wc.reduce((s, v) => s + v, 0) / wc.length;
  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median(wc) * 10) / 10,
    p25: Math.round(quantile(wc, 0.25) * 10) / 10,
    p75: Math.round(quantile(wc, 0.75) * 10) / 10,
    min: wc[0],
    max: wc[wc.length - 1],
  };
}

export function wordCountDistribution(links) {
  const wc = links.filter(isSuccess).map((p) => p.wordCount || 0);
  const bins = [
    ["0-100", 0, 100],
    ["101-300", 101, 300],
    ["301-600", 301, 600],
    ["601-1000", 601, 1000],
    ["1001-2000", 1001, 2000],
    ["2001+", 2001, Infinity],
  ];
  return Object.fromEntries(bins.map(([label, lo, hi]) => [label, wc.filter((v) => v >= lo && v <= hi).length]));
}

export function readingLevelDistribution(links) {
  const rl = links.filter(isSuccess).map((p) => p.readingLevel || 0);
  const bins = [
    ["Elementary (0-5)", 0, 5],
    ["Middle School (6-8)", 6, 8],
    ["High School (9-12)", 9, 12],
    ["College (13+)", 13, 99],
  ];
  return Object.fromEntries(bins.map(([label, lo, hi]) => [label, rl.filter((v) => v >= lo && v <= hi).length]));
}

export function contentRatioDistribution(links) {
  const cr = links.filter(isSuccess).map((p) => p.contentHtmlRatio || 0);
  const bins = [
    ["<10%", 0, 10],
    ["10-20%", 10.01, 20],
    ["20-40%", 20.01, 40],
    [">40%", 40.01, 100],
  ];
  return Object.fromEntries(bins.map(([label, lo, hi]) => [label, cr.filter((v) => v >= lo && v <= hi).length]));
}

export function topKeywordsSite(links, limit = 30) {
  const counts = new Map();
  for (const p of links.filter(isSuccess)) {
    for (const { word, count } of p.topKeywords || []) {
      if (!word) continue;
      counts.set(word, (counts.get(word) || 0) + count);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export function thinPagesByWordCount(links) {
  return links
    .filter(isSuccess)
    .filter((p) => (p.wordCount || 0) > 0 && p.wordCount < 300)
    .map((p) => ({ url: p.url, wordCount: p.wordCount }));
}

export function seoHealth(links) {
  const titleLens = links.map((p) => (p.title || "").trim().length);
  const missingTitle = titleLens.filter((l) => l === 0).length;
  const titleShort = titleLens.filter((l) => l > 0 && l < TITLE_LEN_MIN).length;
  const titleLong = titleLens.filter((l) => l > TITLE_LEN_MAX).length;
  const titleOk = titleLens.filter((l) => l >= TITLE_LEN_MIN && l <= TITLE_LEN_MAX).length;

  const mdLens = links.map((p) => p.metaDescriptionLen || 0);
  const missingMetaDesc = mdLens.filter((l) => l === 0).length;
  const metaDescShort = mdLens.filter((l) => l > 0 && l < META_DESC_LEN_MIN).length;
  const metaDescLong = mdLens.filter((l) => l > META_DESC_LEN_MAX).length;
  const metaDescOk = mdLens.filter((l) => l >= META_DESC_LEN_MIN && l <= META_DESC_LEN_MAX).length;

  const h1Counts = links.map((p) => (p.h1Count ?? -1));
  const h1Zero = h1Counts.filter((c) => c === 0).length;
  const h1One = h1Counts.filter((c) => c === 1).length;
  const h1Multi = h1Counts.filter((c) => c > 1).length;

  const thinContent = links.filter((p) => (p.contentLength || 0) > 0 && p.contentLength < THIN_CONTENT_CHARS).length;

  return {
    missingTitle, titleShort, titleLong, titleOk,
    missingMetaDesc, metaDescShort, metaDescLong, metaDescOk,
    h1Zero, h1One, h1Multi,
    thinContent,
  };
}

export function socialCoverage(links) {
  const htmlPages = links.filter(isSuccess).filter((p) => (p.contentType || "").toLowerCase().includes("text/html"));
  const total = htmlPages.length || 1;

  const missingOg = htmlPages.filter((p) => !(p.ogTitle || "").trim()).map((p) => p.url);
  const missingTwitter = htmlPages.filter((p) => !(p.twitterCard || "").trim()).map((p) => p.url);
  const ogImageMissing = htmlPages.filter((p) => !(p.ogImage || "").trim()).map((p) => p.url);

  return {
    ogCoveragePct: htmlPages.length ? Math.round((1000 * (htmlPages.length - missingOg.length)) / total) / 10 : 0,
    twitterCoveragePct: htmlPages.length ? Math.round((1000 * (htmlPages.length - missingTwitter.length)) / total) / 10 : 0,
    ogImageCoveragePct: htmlPages.length ? Math.round((1000 * (htmlPages.length - ogImageMissing.length)) / total) / 10 : 0,
    missingOg: missingOg.slice(0, 100),
    missingTwitter: missingTwitter.slice(0, 100),
    ogImageMissing: ogImageMissing.slice(0, 100),
  };
}

export function responseTimeStats(links) {
  const rt = links.map((p) => p.responseTimeMs).filter((v) => typeof v === "number").sort((a, b) => a - b);
  if (!rt.length) return { p25: 0, p50: 0, p75: 0, p95: 0, p99: 0, distribution: {}, slowPages: [] };

  const bins = [
    ["<200ms", 0, 200],
    ["200-500ms", 200, 500],
    ["500ms-1s", 500, 1000],
    ["1-2s", 1000, 2000],
    [">2s", 2000, Infinity],
  ];
  const distribution = Object.fromEntries(
    bins.map(([label, lo, hi]) => [label, links.filter((p) => (p.responseTimeMs || 0) >= lo && (p.responseTimeMs || 0) < hi).length]),
  );

  const slowPages = links
    .filter((p) => (p.responseTimeMs || 0) > 2000)
    .map((p) => ({ url: p.url, responseTimeMs: p.responseTimeMs }))
    .sort((a, b) => b.responseTimeMs - a.responseTimeMs)
    .slice(0, 50);

  return {
    p25: Math.round(quantile(rt, 0.25)),
    p50: Math.round(quantile(rt, 0.5)),
    p75: Math.round(quantile(rt, 0.75)),
    p95: Math.round(quantile(rt, 0.95)),
    p99: Math.round(quantile(rt, 0.99)),
    distribution,
    slowPages,
  };
}

export function hreflangSummary(links) {
  const pages2xx = links.filter(isSuccess);
  const missingHtmlLang = pages2xx.filter((p) => !(p.pageAnalysis?.htmlLang || "").trim()).length;
  const withHreflang = pages2xx.filter((p) => (p.pageAnalysis?.hreflangAlternates || []).length > 0).length;
  return {
    pages200: pages2xx.length,
    pagesMissingHtmlLang: missingHtmlLang,
    pagesWithHreflangLinks: withHreflang,
  };
}

export function outboundLinkDomains(links, startUrl, maxRows = 200) {
  let siteHost = "";
  try {
    siteHost = new URL(startUrl).host.toLowerCase();
  } catch {
    /* ignore */
  }

  const hostPages = new Map();
  const hostLinkCount = new Map();

  for (const p of links) {
    if (typeof p.status === "number" && p.status >= 400) continue;
    for (const link of p.pageAnalysis?.externalLinks || []) {
      let host;
      try {
        host = new URL(link).host.toLowerCase();
      } catch {
        continue;
      }
      if (!host || host === siteHost) continue;
      if (!hostPages.has(host)) hostPages.set(host, new Set());
      hostPages.get(host).add(p.url);
      hostLinkCount.set(host, (hostLinkCount.get(host) || 0) + 1);
    }
  }

  return [...hostPages.entries()]
    .map(([host, pages]) => ({ host, pageCount: pages.size, linkCount: hostLinkCount.get(host) || 0 }))
    .sort((a, b) => b.linkCount - a.linkCount || b.pageCount - a.pageCount || a.host.localeCompare(b.host))
    .slice(0, maxRows);
}
