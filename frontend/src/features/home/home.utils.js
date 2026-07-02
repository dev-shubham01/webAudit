export function extractHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function healthScoreClass(score) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

/** Group report-list rows by domain, keeping only the most recent crawl per domain. */
export function groupReportsByDomain(reportList) {
  const brandMap = new Map();

  for (const r of reportList) {
    const domainName = extractHostname(r.url) || r.siteName || "Unknown Domain";
    const summary = r.summary || {};
    const urlCount = summary.totalUrls || 0;
    const statusCounts = {
      s2xx: summary.count2xx || 0,
      s3xx: summary.count3xx || 0,
      s4xx: summary.count4xx || 0,
      s5xx: summary.count5xx || 0,
    };
    statusCounts.other = Math.max(
      0,
      urlCount - (statusCounts.s2xx + statusCounts.s3xx + statusCounts.s4xx + statusCounts.s5xx),
    );

    const generatedAtMs = r.generatedAt ? new Date(r.generatedAt).getTime() : 0;
    const existing = brandMap.get(domainName);
    if (!existing || generatedAtMs > existing.generatedAtMs) {
      brandMap.set(domainName, {
        domainName,
        crawlUrl: r.url || "—",
        urlCount,
        healthScore: r.healthScore ?? 0,
        statusCounts,
        lastCrawl: r.generatedAt ? new Date(r.generatedAt).toLocaleString() : "",
        reportId: r.id,
        generatedAtMs,
      });
    }
  }

  return [...brandMap.values()].sort((a, b) => b.generatedAtMs - a.generatedAtMs);
}
