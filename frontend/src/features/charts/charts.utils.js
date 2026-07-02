// Client-side aggregation for the Crawl Analytics page — mirrors the
// reference's Charts.jsx datasets (status_counts, mime_labels/values,
// outlink_labels/counts, title_labels/counts, domain_labels/values), all
// computed here from report.data.links since no backend field carries them.

export function statusDistribution(summary) {
  return [
    { name: "2xx", count: summary.count2xx || 0 },
    { name: "3xx", count: summary.count3xx || 0 },
    { name: "4xx", count: summary.count4xx || 0 },
    { name: "5xx", count: summary.count5xx || 0 },
  ]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function mimeDistribution(links, limit = 12) {
  const counts = new Map();
  for (const p of links) {
    const mime = (p.contentType || "").split(";")[0].trim() || "unknown";
    counts.set(mime, (counts.get(mime) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function outlinksDistribution(links) {
  const bins = [
    ["0", 0, 0],
    ["1-5", 1, 5],
    ["6-10", 6, 10],
    ["11-20", 11, 20],
    ["21-50", 21, 50],
    ["51+", 51, Infinity],
  ];
  return bins.map(([name, lo, hi]) => ({
    name,
    count: links.filter((p) => (p.outlinksCount || 0) >= lo && (p.outlinksCount || 0) <= hi).length,
  }));
}

// Bucket boundaries mirror the SEO title-length thresholds used elsewhere
// (content.utils.js TITLE_LEN_MIN/MAX = 30/60) — the reference computes this
// server-side with its own (unseen) bucketing, so this is a faithful
// approximation using this project's established thresholds.
export function titleLengthDistribution(links) {
  const bins = [
    ["0", 0, 0],
    ["1-29", 1, 29],
    ["30-60", 30, 60],
    ["61-100", 61, 100],
    ["101+", 101, Infinity],
  ];
  const lens = links.map((p) => (p.title || "").trim().length);
  return bins.map(([name, lo, hi]) => ({
    name,
    count: lens.filter((l) => l >= lo && l <= hi).length,
  }));
}

export function bubbleData(topPages, limit = 40) {
  const inlinks = topPages.map((p) => p.inlinksCount || 0);
  const maxInlinks = Math.max(1, ...inlinks);
  return topPages
    .slice(0, limit)
    .map((p) => ({
      x: p.inlinksCount || 0,
      y: p.wordCount || 0,
      r: Math.max(4, Math.min(24, ((p.inlinksCount || 0) / maxInlinks) * 24)),
      url: p.url,
    }))
    .filter((d) => d.x > 0 || d.y > 0);
}

export function scatterData(links, limit = 200) {
  return links
    .filter((p) => (p.wordCount || 0) > 0 && (p.responseTimeMs || 0) > 0)
    .slice(0, limit)
    .map((p) => ({ x: p.wordCount, y: p.responseTimeMs, url: p.url }));
}
