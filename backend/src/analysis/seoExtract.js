import { normalizeLink } from "../utils/urls.js";

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "your", "have", "are",
  "was", "were", "been", "will", "would", "could", "should", "about", "which",
  "their", "there", "what", "when", "where", "more", "some", "than", "them",
  "other", "into", "over", "also", "just", "after", "before", "only", "then",
  "very", "most", "each", "such", "like", "does", "here", "because", "being",
  "well", "while", "these", "those", "both", "many", "much", "even", "back",
  "through", "still", "between", "every", "under", "last", "long", "great",
  "make", "same", "come", "take", "know", "they", "page", "site", "home",
  "click", "read", "view", "next", "menu", "main", "skip", "content", "link",
  "http", "https", "www", "html", "class", "none", "true", "false", "null",
]);

function countSyllables(word) {
  const lower = word.toLowerCase();
  if (lower.length <= 3) return 1;
  let count = 0;
  let prevVowel = false;
  for (const ch of lower) {
    const isVowel = "aeiouy".includes(ch);
    if (isVowel && !prevVowel) count += 1;
    prevVowel = isVowel;
  }
  if (lower.endsWith("e") && count > 1) count -= 1;
  return Math.max(1, count);
}

function extractContentText($, rawHtml) {
  const body = $("body").clone();
  body.find("script, style, noscript").remove();
  const bodyText = body.text().replace(/\s+/g, " ").trim();

  const words = (bodyText.match(/[a-zA-Z]+/g) || []).filter((w) => w.length >= 2);
  const wordCount = words.length;

  const sentences = bodyText.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
  const sentenceCount = Math.max(1, sentences.length);

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  let readingLevel = 0;
  if (wordCount > 30) {
    readingLevel =
      0.39 * (wordCount / sentenceCount) + 11.8 * (totalSyllables / Math.max(1, wordCount)) - 15.59;
    readingLevel = Math.max(0, Math.min(18, Math.round(readingLevel * 10) / 10));
  }

  const htmlLen = Math.max(1, rawHtml.length);
  const contentHtmlRatio = Math.round((bodyText.length / htmlLen) * 1000) / 10;

  const keywordCounts = new Map();
  for (const w of words) {
    const lower = w.toLowerCase();
    if (lower.length < 4 || STOP_WORDS.has(lower)) continue;
    keywordCounts.set(lower, (keywordCounts.get(lower) || 0) + 1);
  }
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  const maxCount = topKeywords[0]?.[1] ?? 0;
  const keywordRows = topKeywords.map(({ word, count }) => ({
    word,
    count,
    score: maxCount ? Math.round((100 * count) / maxCount) : 0,
  }));

  return { wordCount, readingLevel, contentHtmlRatio, topKeywords: keywordRows };
}

function metaContent($, attrs) {
  const selector = Object.entries(attrs)
    .map(([k, v]) => `[${k}="${v}"]`)
    .join("");
  return ($(`meta${selector}`).attr("content") || "").trim();
}

/**
 * Full SEO/content/social extraction for one page's HTML. Mirrors the
 * reference's parse_seo + parse_seo_extended + parse_content_text +
 * parse_social_meta (common.py), combined into one pass over the DOM.
 */
export function extractSeo($, pageUrl, rawHtml) {
  const title = ($("title").first().text() || "").trim();

  let metaDescription = (metaContent($, { name: "description" }) || "").trim();
  if (!metaDescription) {
    metaDescription = metaContent($, { property: "og:description" });
  }

  const h1Tags = $("h1");
  const h1Count = h1Tags.length;
  const h1Text = h1Count ? h1Tags.first().text().trim() : "";

  const canonicalHref = $('link[rel="canonical"]').first().attr("href");
  const canonicalUrl = canonicalHref ? normalizeLink(pageUrl, canonicalHref) || "" : "";

  const viewportTag = $('meta[name="viewport"]');
  const viewportContent = (viewportTag.attr("content") || "").trim();
  const viewportPresent = viewportTag.length > 0 && viewportContent.length > 0;

  const robotsContent = ($('meta[name="robots"]').attr("content") || "").toLowerCase();
  const noindex = robotsContent.includes("noindex");

  const hasSchema =
    $('script[type="application/ld+json"]').length > 0 || $("[itemscope]").length > 0;

  const headingSequence = $("h1, h2, h3, h4, h5, h6")
    .map((_, el) => el.tagName.toLowerCase())
    .get();

  const baseScheme = (() => {
    try {
      return new URL(pageUrl).protocol.replace(":", "");
    } catch {
      return "";
    }
  })();

  let imagesTotal = 0;
  let imagesWithoutAlt = 0;
  let imgWithoutLazy = 0;
  let imgWithoutDimensions = 0;
  let mixedContentCount = 0;

  $("img").each((_, el) => {
    const img = $(el);
    imagesTotal += 1;
    if (!img.attr("alt") && !img.attr("aria-label")) imagesWithoutAlt += 1;
    if ((img.attr("loading") || "").toLowerCase() !== "lazy") imgWithoutLazy += 1;
    if (!img.attr("width") && !img.attr("height")) imgWithoutDimensions += 1;
    const src = (img.attr("src") || "").trim().toLowerCase();
    if (baseScheme === "https" && src.startsWith("http://")) mixedContentCount += 1;
  });

  let ariaCount = 0;
  $("*").each((_, el) => {
    const attribs = el.attribs || {};
    if (Object.keys(attribs).some((k) => k.startsWith("aria-"))) ariaCount += 1;
  });

  const content = extractContentText($, rawHtml);

  return {
    title,
    metaDescription,
    metaDescriptionLen: metaDescription.length,
    h1Text,
    h1Count,
    canonicalUrl,
    viewportPresent,
    viewportContent,
    noindex,
    hasSchema,
    headingSequence,
    imagesTotal,
    imagesWithoutAlt,
    imgWithoutLazy,
    imgWithoutDimensions,
    ariaCount,
    mixedContentCount,
    ...content,
    ogTitle: metaContent($, { property: "og:title" }),
    ogDescription: metaContent($, { property: "og:description" }),
    ogImage: metaContent($, { property: "og:image" }),
    ogType: metaContent($, { property: "og:type" }),
    twitterCard: metaContent($, { name: "twitter:card" }),
    twitterTitle: metaContent($, { name: "twitter:title" }),
    twitterImage: metaContent($, { name: "twitter:image" }),
  };
}
