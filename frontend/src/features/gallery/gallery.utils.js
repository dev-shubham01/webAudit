// Ported from the reference's views/Gallery.jsx image-collection logic.

export const KIND_LABELS = { content: "On-page", og: "Open Graph", twitter: "Twitter / X" };

function resolveImageSrc(raw, pageUrl) {
  let s = (raw || "").trim();
  if (!s) return null;
  if (s.startsWith("//")) s = `https:${s}`;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  try {
    return new URL(s, pageUrl).href;
  } catch {
    return null;
  }
}

/** Aggregate content/OG/Twitter images from crawled pages (report.data.links) into unique tiles with source refs. */
export function collectFromLinks(links) {
  const map = new Map();
  const add = (rawSrc, pageUrl, kind) => {
    const src = resolveImageSrc(rawSrc, pageUrl);
    if (!src || src.startsWith("data:text")) return;
    if (!map.has(src)) map.set(src, { src, refs: [] });
    const entry = map.get(src);
    if (!entry.refs.some((r) => r.pageUrl === pageUrl && r.kind === kind)) {
      entry.refs.push({ pageUrl, kind });
    }
  };

  for (const link of links || []) {
    const pageUrl = link?.url;
    if (!pageUrl) continue;
    const imageUrls = Array.isArray(link.pageAnalysis?.imageUrls) ? link.pageAnalysis.imageUrls : [];
    for (const u of imageUrls) add(u, pageUrl, "content");
    add(link.ogImage, pageUrl, "og");
    add(link.twitterImage, pageUrl, "twitter");
  }
  return Array.from(map.values());
}
