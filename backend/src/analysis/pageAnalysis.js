import * as cheerio from "cheerio";
import { normalizeLink } from "../utils/urls.js";

const LIST_CAP = 200;
const INLINE_SCRIPT_WARN_BYTES = 8192;
const HEADING_ORDER = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

function cap(list) {
  return list.slice(0, LIST_CAP);
}

function relList($, el) {
  const rel = $(el).attr("rel");
  return rel ? rel.toLowerCase().split(/\s+/) : [];
}

function visibleAnchorText($, a) {
  const text = $(a).text().trim();
  if (text) return text;
  return $(a).find("img").length > 0 ? "x" : "";
}

function inputHasLabel($, input) {
  const el = $(input);
  if ((el.attr("aria-label") || "").trim()) return true;
  if ((el.attr("aria-labelledby") || "").trim()) return true;
  const type = (el.attr("type") || "").toLowerCase();
  if (["hidden", "submit", "button", "image", "reset"].includes(type)) return true;
  const id = (el.attr("id") || "").trim();
  if (id && $(`label[for="${id}"]`).length > 0) return true;
  return el.parents("label").length > 0;
}

function jsonLdMissingType(data) {
  const SKIP = new Set(["@context", "@id", "@language"]);

  function isEntityDict(obj) {
    if ("@type" in obj) return false;
    if ("@context" in obj && Object.keys(obj).length === 1) return false;
    return Object.keys(obj).some((k) => !SKIP.has(k));
  }

  function walk(obj) {
    if (Array.isArray(obj)) return obj.some(walk);
    if (obj && typeof obj === "object") {
      if ("@graph" in obj) {
        if (walk(obj["@graph"])) return true;
      } else if (isEntityDict(obj) && !("@type" in obj)) {
        return true;
      }
      for (const [k, v] of Object.entries(obj)) {
        if (k === "@graph") continue;
        if (v && typeof v === "object" && walk(v)) return true;
      }
    }
    return false;
  }

  return walk(data);
}

/**
 * Structured on-page analysis (link split, resource inventory, heuristic
 * warnings) from raw HTML. Mirrors the reference's analysis/page.py::analyze_html.
 */
export function analyzeHtml(html, pageUrl, canonicalUrl = "") {
  const out = {
    internalLinkCount: 0,
    externalLinkCount: 0,
    internalLinks: [],
    externalLinks: [],
    htmlLang: "",
    hreflangAlternates: [],
    scriptUrls: [],
    stylesheetUrls: [],
    imageUrls: [],
    preloadCount: 0,
    preconnectCount: 0,
    thirdPartyScriptCount: 0,
    warnings: [],
  };

  let pageHost;
  try {
    pageHost = new URL(pageUrl).host.toLowerCase();
  } catch {
    return out;
  }
  if (!html || !pageHost) return out;

  const $ = cheerio.load(html);
  const warnings = [];
  const warn = (id, severity, message, detail) => {
    const w = { id, severity, message };
    if (detail) w.detail = detail;
    warnings.push(w);
  };

  out.htmlLang = ($("html").attr("lang") || "").trim();

  const hreflangEntries = [];
  $("link[href]").each((_, el) => {
    if (!relList($, el).includes("alternate")) return;
    const hreflang = ($(el).attr("hreflang") || "").trim();
    const href = $(el).attr("href");
    if (!hreflang || !href) return;
    const resolved = normalizeLink(pageUrl, href);
    if (resolved) hreflangEntries.push({ hreflang: hreflang.toLowerCase(), href: resolved });
  });
  out.hreflangAlternates = hreflangEntries.slice(0, LIST_CAP);

  $("link[href]").each((_, el) => {
    const rels = relList($, el);
    if (rels.includes("preload")) out.preloadCount += 1;
    if (rels.includes("preconnect") || rels.includes("dns-prefetch")) out.preconnectCount += 1;
  });

  const internal = [];
  const external = [];
  const seenAnchors = new Set();
  $("a[href]").each((_, el) => {
    const ln = normalizeLink(pageUrl, $(el).attr("href"));
    if (!ln || seenAnchors.has(ln)) return;
    seenAnchors.add(ln);
    const host = new URL(ln).host.toLowerCase();
    (host === pageHost ? internal : external).push(ln);
  });
  out.internalLinkCount = internal.length;
  out.externalLinkCount = external.length;
  out.internalLinks = cap(internal);
  out.externalLinks = cap(external);

  if (!canonicalUrl.trim()) {
    warn("missing_canonical", "medium", "Missing canonical link", 'Add a <link rel="canonical"> pointing to the preferred URL.');
  }
  if (!out.htmlLang) {
    warn("missing_html_lang", "low", "Missing lang attribute on <html>", 'Add <html lang="..."> matching the primary language of the page.');
  }
  if (hreflangEntries.filter((e) => e.hreflang === "x-default").length > 1) {
    warn("hreflang_multiple_x_default", "medium", "Multiple x-default hreflang entries", "Use a single x-default alternate URL.");
  }

  const path = new URL(pageUrl).pathname || "/";
  if (path !== "/" && path.endsWith("/")) {
    warn("trailing_slash_path", "low", "URL path ends with a trailing slash", pageUrl);
  }
  if (/\/[A-Z]/.test(path)) {
    warn("uppercase_path", "low", "URL path contains uppercase characters", path);
  }

  const headingSeq = $("h1, h2, h3, h4, h5, h6").map((_, el) => el.tagName.toLowerCase()).get();
  for (let i = 1; i < headingSeq.length; i += 1) {
    const prevLevel = HEADING_ORDER[headingSeq[i - 1]] || 0;
    const curLevel = HEADING_ORDER[headingSeq[i]] || 0;
    if (curLevel > prevLevel + 1) {
      warn(
        "skipped_heading_level",
        "low",
        `Skipped heading level: ${headingSeq[i - 1]} to ${headingSeq[i]}`,
        "Use sequential heading levels where possible.",
      );
      break;
    }
  }

  const head = $("head").get(0);
  const scriptInHead = (el) => Boolean(head) && $(el).parents("head").get(0) === head;

  const scriptUrls = [];
  let thirdParty = 0;
  let inlineLarge = 0;

  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      const url = normalizeLink(pageUrl, src);
      if (url) {
        scriptUrls.push(url);
        if (new URL(url).host.toLowerCase() !== pageHost) thirdParty += 1;
      }
      return;
    }
    const body = $(el).html() || "";
    if (Buffer.byteLength(body, "utf-8") >= INLINE_SCRIPT_WARN_BYTES) inlineLarge += 1;
  });

  if (inlineLarge) {
    warn(
      "large_inline_script",
      "medium",
      `Found ${inlineLarge} large inline script(s)`,
      `Each exceeds ~${Math.floor(INLINE_SCRIPT_WARN_BYTES / 1024)} KB; consider external files or splitting.`,
    );
  }

  out.thirdPartyScriptCount = thirdParty;
  if (thirdParty) {
    warn("third_party_scripts", "low", `Found ${thirdParty} third-party script(s)`, "Review impact on performance and privacy.");
  }

  $("script[src]").each((_, el) => {
    const url = normalizeLink(pageUrl, $(el).attr("src"));
    if (!url || new URL(url).host.toLowerCase() !== pageHost) return;
    if (scriptInHead(el) && !$(el).attr("async") && !$(el).attr("defer")) {
      warn("render_blocking_script", "medium", "Potentially render-blocking script in <head>", url);
    }
  });
  out.scriptUrls = cap(scriptUrls);

  const stylesheetUrls = [];
  $("link").each((_, el) => {
    if (!relList($, el).includes("stylesheet")) return;
    const href = $(el).attr("href");
    if (!href) return;
    const url = normalizeLink(pageUrl, href);
    if (url) stylesheetUrls.push(url);
    const media = ($(el).attr("media") || "").trim().toLowerCase();
    if ((!media || media === "all") && url) {
      warn("stylesheet_blocking_hint", "low", "Stylesheet may block rendering (no restrictive media attribute)", url);
    }
  });
  out.stylesheetUrls = cap(stylesheetUrls);

  const imageUrls = [];
  $("img[src]").each((_, el) => {
    const url = normalizeLink(pageUrl, $(el).attr("src"));
    if (url) imageUrls.push(url);
  });
  out.imageUrls = cap(imageUrls);

  let jsonLdWarned = false;
  $('script[type*="ld+json" i]').each((idx, el) => {
    if (jsonLdWarned) return;
    const raw = ($(el).html() || "").trim();
    if (!raw) return;
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      warn("json_ld_parse", "medium", "Invalid JSON-LD block", `Block index ${idx}`);
      return;
    }
    if (jsonLdMissingType(data)) {
      warn(
        "json_ld_missing_type",
        "medium",
        "JSON-LD may be missing @type on one or more objects",
        "Validate with Rich Results Test; ensure each entity includes @type where required.",
      );
      jsonLdWarned = true;
    }
  });

  let emptyAnchors = 0;
  $("a[href]").each((_, el) => {
    if (!visibleAnchorText($, el)) emptyAnchors += 1;
  });
  if (emptyAnchors) {
    warn("empty_anchor", "medium", `Found ${emptyAnchors} link(s) with no visible text`, "Add descriptive text or aria-label.");
  }

  let badInputs = 0;
  $("input, textarea, select").each((_, el) => {
    if (!inputHasLabel($, el)) badInputs += 1;
  });
  if (badInputs) {
    warn(
      "form_missing_label",
      "medium",
      `Found ${badInputs} form control(s) without an associated label`,
      'Use <label for="id">, wrap in <label>, or aria-label.',
    );
  }

  out.warnings = warnings;
  return out;
}
