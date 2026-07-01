const TITLE_LEN_MIN = 30;
const TITLE_LEN_MAX = 60;
const META_DESC_LEN_MIN = 70;
const META_DESC_LEN_MAX = 160;

export function wordCountDistribution(links) {
  const buckets = [
    { name: "0-100", test: (w) => w <= 100 },
    { name: "101-300", test: (w) => w > 100 && w <= 300 },
    { name: "301-600", test: (w) => w > 300 && w <= 600 },
    { name: "601-1000", test: (w) => w > 600 && w <= 1000 },
    { name: "1001-2000", test: (w) => w > 1000 && w <= 2000 },
    { name: "2001+", test: (w) => w > 2000 },
  ];
  return buckets.map(({ name, test }) => ({
    name,
    count: links.filter((l) => test(l.wordCount || 0)).length,
  }));
}

export function responseTimeDistribution(links) {
  const buckets = [
    { name: "<200ms", test: (t) => t < 200 },
    { name: "200-500ms", test: (t) => t >= 200 && t < 500 },
    { name: "500ms-1s", test: (t) => t >= 500 && t < 1000 },
    { name: "1-2s", test: (t) => t >= 1000 && t < 2000 },
    { name: ">2s", test: (t) => t >= 2000 },
  ];
  return buckets.map(({ name, test }) => ({
    name,
    count: links.filter((l) => test(l.responseTimeMs || 0)).length,
  }));
}

export function crawlDepthDistribution(links) {
  const counts = new Map();
  for (const l of links) counts.set(l.depth, (counts.get(l.depth) || 0) + 1);
  const depths = [...counts.keys()].sort((a, b) => a - b);
  const data = depths.map((d) => ({ name: `Depth ${d}`, count: counts.get(d) }));
  const maxDepth = depths.length ? Math.max(...depths) : 0;
  const avgDepth = links.length ? links.reduce((s, l) => s + (l.depth || 0), 0) / links.length : 0;
  return { data, maxDepth, avgDepth: Math.round(avgDepth * 10) / 10 };
}

function classifyLength(len, min, max) {
  if (len === 0) return "Missing";
  if (len < min) return "Too short";
  if (len > max) return "Too long";
  return "In range";
}

export function titleMetaHealth(links) {
  const categories = ["Missing", "Too short", "Too long", "In range"];
  const titleCounts = new Map(categories.map((c) => [c, 0]));
  const metaCounts = new Map(categories.map((c) => [c, 0]));

  for (const l of links) {
    const titleCat = classifyLength(l.title?.length || 0, TITLE_LEN_MIN, TITLE_LEN_MAX);
    const metaCat = classifyLength(l.metaDescriptionLen || 0, META_DESC_LEN_MIN, META_DESC_LEN_MAX);
    titleCounts.set(titleCat, titleCounts.get(titleCat) + 1);
    metaCounts.set(metaCat, metaCounts.get(metaCat) + 1);
  }

  return categories.map((name) => ({
    name,
    "Title tags": titleCounts.get(name),
    "Meta descriptions": metaCounts.get(name),
  }));
}

export function socialPreviewCoverage(links) {
  const total = links.length || 1;
  const ogTitle = links.filter((l) => (l.ogTitle || "").trim()).length;
  const twitterCard = links.filter((l) => (l.twitterCard || "").trim()).length;
  const ogImage = links.filter((l) => (l.ogImage || "").trim()).length;
  return [
    { name: "og:title", count: Math.round((ogTitle / total) * 100) },
    { name: "Twitter card", count: Math.round((twitterCard / total) * 100) },
    { name: "og:image", count: Math.round((ogImage / total) * 100) },
  ];
}

export function readingLevelDistribution(links) {
  const buckets = [
    { name: "Elementary (0-5)", test: (r) => r <= 5 },
    { name: "Middle School (6-8)", test: (r) => r > 5 && r <= 8 },
    { name: "High School (9-12)", test: (r) => r > 8 && r <= 12 },
    { name: "College (13+)", test: (r) => r > 12 },
  ];
  const withReading = links.filter((l) => (l.wordCount || 0) > 30);
  return buckets.map(({ name, test }) => ({
    name,
    count: withReading.filter((l) => test(l.readingLevel || 0)).length,
  }));
}

export function topMimeTypes(links) {
  const counts = new Map();
  for (const l of links) {
    const mime = (l.contentType || "unknown").split(";")[0].trim() || "unknown";
    counts.set(mime, (counts.get(mime) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
}

export function statusBreakdown(summary) {
  return [
    { name: "2xx", count: summary.count2xx },
    { name: "3xx", count: summary.count3xx },
    { name: "4xx", count: summary.count4xx },
    { name: "5xx", count: summary.count5xx },
  ].filter((d) => d.count > 0);
}
