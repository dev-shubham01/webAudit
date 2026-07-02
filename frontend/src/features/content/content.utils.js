const TITLE_LEN_MIN = 30;
const TITLE_LEN_MAX = 60;
const META_DESC_LEN_MIN = 70;
const META_DESC_LEN_MAX = 160;
// This mirrors the reference's THIN_CONTENT_CHARS threshold, which is
// checked against the raw HTTP response byte size (contentLength), not word
// count — a different (much lower-value) signal than content_analytics'
// word-count-based "thin pages" list. Kept faithful even though it rarely
// fires for real HTML pages.
const THIN_CONTENT_CHARS = 300;

// Exact filter set + guidance copy ported from the reference's views/Content.jsx.
export const CONTENT_FILTERS = [
  {
    key: "missing_h1",
    label: "Missing H1",
    guidance:
      "Every page should have exactly one H1 tag that clearly describes the page content for both users and search engines.",
  },
  {
    key: "missing_title",
    label: "Missing Title",
    guidance:
      "The <title> tag is a critical ranking signal. Missing titles result in poor click-through rates from search results.",
  },
  {
    key: "multiple_h1",
    label: "Multiple H1s",
    guidance: "Having more than one H1 dilutes your heading hierarchy. Consolidate to a single, keyword-rich H1 per page.",
  },
  {
    key: "missing_meta_desc",
    label: "Missing Meta Desc",
    guidance:
      "Meta descriptions influence click-through rates. Write a unique, compelling 120–160 character summary for each page.",
  },
  {
    key: "meta_desc_short",
    label: "Meta Desc Short",
    guidance:
      "Meta descriptions under ~120 characters leave wasted SERP real estate. Expand them to be more descriptive and persuasive.",
  },
  {
    key: "meta_desc_long",
    label: "Meta Desc Long",
    guidance: "Meta descriptions over ~160 characters get truncated in search results. Trim them down to the most impactful text.",
  },
  {
    key: "thin_content",
    label: "Thin Content",
    guidance: "Pages with very little text (under ~300 words) are often low-value to search engines. Expand or consolidate thin pages.",
  },
];

/** Build the 7 content-issue URL lists (report.data.content_urls equivalent) from report.data.links. */
export function buildContentUrls(links) {
  const missingH1 = [];
  const missingTitle = [];
  const multipleH1 = [];
  const missingMetaDesc = [];
  const metaDescShort = [];
  const metaDescLong = [];
  const thinContent = [];

  for (const p of links) {
    const title = (p.title || "").trim();

    if (p.h1Count === 0) missingH1.push({ url: p.url, title });
    else if (p.h1Count > 1) multipleH1.push({ url: p.url, title, h1Count: p.h1Count });

    if (!title) missingTitle.push({ url: p.url });

    const ml = p.metaDescriptionLen || 0;
    if (ml === 0) missingMetaDesc.push({ url: p.url, title });
    else if (ml < META_DESC_LEN_MIN) metaDescShort.push({ url: p.url, title, metaDescLen: ml });
    else if (ml > META_DESC_LEN_MAX) metaDescLong.push({ url: p.url, title, metaDescLen: ml });

    const cl = p.contentLength || 0;
    if (cl > 0 && cl < THIN_CONTENT_CHARS) thinContent.push({ url: p.url, title, contentLength: cl });
  }

  return {
    missing_h1: missingH1,
    missing_title: missingTitle,
    multiple_h1: multipleH1,
    missing_meta_desc: missingMetaDesc,
    meta_desc_short: metaDescShort,
    meta_desc_long: metaDescLong,
    thin_content: thinContent,
  };
}
