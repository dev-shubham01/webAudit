/**
 * Signature-based tech detection. No maintained Node Wappalyzer package
 * exists (see docs/ARCHITECTURE.md §6) — this ports the reference's own
 * fallback pattern list (common.py::_TECH_PATTERNS) as the primary approach.
 */
const TECH_PATTERNS = [
  ["WordPress", "html", "/wp-content/"],
  ["WordPress", "html", "/wp-includes/"],
  ["Drupal", "metaGenerator", "Drupal"],
  ["Joomla", "metaGenerator", "Joomla"],
  ["Shopify", "html", "cdn.shopify.com"],
  ["Squarespace", "html", "squarespace.com"],
  ["Wix", "html", "wix.com"],
  ["Next.js", "html", "__NEXT_DATA__"],
  ["Next.js", "html", "_next/static"],
  ["Nuxt.js", "html", "__NUXT__"],
  ["Gatsby", "html", "gatsby-"],
  ["React", "html", "data-reactroot"],
  ["React", "html", "__REACT_DEVTOOLS"],
  ["React", "html", "react.production.min"],
  ["Vue.js", "html", "__vue"],
  ["Vue.js", "html", "vue.min.js"],
  ["Angular", "html", "ng-version"],
  ["Angular", "html", "ng-app"],
  ["Svelte", "asset", "svelte"],
  ["jQuery", "asset", "jquery"],
  ["Bootstrap", "asset", "bootstrap"],
  ["Tailwind CSS", "asset", "tailwindcss"],
  ["Google Analytics", "asset", "google-analytics.com/analytics.js"],
  ["Google Analytics", "asset", "googletagmanager.com/gtag"],
  ["Google Tag Manager", "asset", "googletagmanager.com/gtm.js"],
  ["Facebook Pixel", "asset", "connect.facebook.net"],
  ["Hotjar", "asset", "hotjar.com"],
  ["Google Fonts", "asset", "fonts.googleapis.com"],
  ["Font Awesome", "asset", "fontawesome"],
  ["Cloudflare", "header", "cf-ray"],
  ["Nginx", "headerServer", "nginx"],
  ["Apache", "headerServer", "apache"],
  ["LiteSpeed", "headerServer", "litespeed"],
  ["Vercel", "headerServer", "vercel"],
  ["Netlify", "headerServer", "netlify"],
  ["Amazon CloudFront", "header", "x-amz-cf-id"],
  ["AWS", "headerServer", "amazons3"],
];

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {Record<string,string>} headers lowercase header name -> value
 */
export function detectTechStack($, headers) {
  const detected = new Set();
  const htmlStr = $.html().toLowerCase();
  const generator = ($('meta[name="generator"]').attr("content") || "").toLowerCase();
  const serverHeader = (headers.server || "").toLowerCase();
  const headerValues = Object.values(headers).filter((v) => typeof v === "string");

  // Library/CDN names (bootstrap, jquery, tailwindcss, fontawesome, svelte…)
  // are generic words that can appear in leftover template comments or
  // unused <link> tags without the library actually being used. Restricting
  // these to real <link href>/<script src> values (i.e. resources the page
  // actually loads) avoids false positives from dead markup.
  const assetStr = $("link[href], script[src]")
    .map((_, el) => $(el).attr("href") || $(el).attr("src") || "")
    .get()
    .join(" ")
    .toLowerCase();

  for (const [name, source, pattern] of TECH_PATTERNS) {
    const pat = pattern.toLowerCase();
    if (source === "html" && htmlStr.includes(pat)) {
      detected.add(name);
    } else if (source === "asset" && assetStr.includes(pat)) {
      detected.add(name);
    } else if (source === "metaGenerator" && generator.includes(pat)) {
      detected.add(name);
    } else if (source === "header" && headerValues.some((v) => v.toLowerCase().includes(pat))) {
      detected.add(name);
    } else if (source === "headerServer" && serverHeader.includes(pat)) {
      detected.add(name);
    }
  }

  return [...detected].sort();
}
