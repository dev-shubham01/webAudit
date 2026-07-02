import * as cheerio from "cheerio";

// Param names often used for redirects (open-redirect risk).
const OPEN_REDIRECT_PARAMS = new Set([
  "redirect", "url", "next", "return", "returnUrl", "return_url", "redir",
  "destination", "dest", "target", "goto", "out", "view", "to",
]);

const CSRF_PATTERN = /csrf|token|_token|authenticity_token|_csrf/i;
const MAX_URLS_TO_PROBE = 20;

function finding(findingType, severity, url, message, recommendation, evidence) {
  const out = { findingType, severity, url, message, recommendation };
  if (evidence !== undefined) out.evidence = evidence;
  return out;
}

function isSuccess(page) {
  return typeof page.status === "number" && page.status >= 200 && page.status < 300;
}

/** One finding per missing header type (first URL that lacks it), to avoid flooding the report. */
function passiveHeaders(pages) {
  const findings = [];
  const seen = new Set();

  for (const page of pages.filter(isSuccess)) {
    const url = page.url;
    if (!url) continue;
    const headers = page.headers || {};

    if (!(headers.strictTransportSecurity || "").trim() && !seen.has("missing_hsts")) {
      seen.add("missing_hsts");
      findings.push(
        finding(
          "missing_hsts",
          "High",
          url,
          "Strict-Transport-Security header not set.",
          "Add Strict-Transport-Security (e.g. max-age=31536000; includeSubDomains) to enforce HTTPS.",
        ),
      );
    }

    if (!(headers.xContentTypeOptions || "").trim() && !seen.has("missing_x_content_type_options")) {
      seen.add("missing_x_content_type_options");
      findings.push(
        finding(
          "missing_x_content_type_options",
          "Medium",
          url,
          "X-Content-Type-Options header not set.",
          "Add X-Content-Type-Options: nosniff to prevent MIME sniffing.",
        ),
      );
    }

    if (!(headers.xFrameOptions || "").trim() && !seen.has("missing_x_frame_options")) {
      seen.add("missing_x_frame_options");
      findings.push(
        finding(
          "missing_x_frame_options",
          "Medium",
          url,
          "X-Frame-Options header not set.",
          "Add X-Frame-Options: DENY or SAMEORIGIN to reduce clickjacking risk.",
        ),
      );
    }

    if (!(headers.contentSecurityPolicy || "").trim() && !seen.has("missing_csp")) {
      seen.add("missing_csp");
      findings.push(
        finding(
          "missing_csp",
          "Medium",
          url,
          "Content-Security-Policy header not set.",
          "Add a Content-Security-Policy to mitigate XSS and injection.",
        ),
      );
    }
  }

  return findings;
}

/** Findings for URLs that resolve to HTTP (final_url). */
function passiveHttps(pages) {
  const findings = [];
  for (const page of pages) {
    const final = (page.finalUrl || "").trim();
    if (final.toLowerCase().startsWith("http://")) {
      findings.push(
        finding(
          "http_final_url",
          "Critical",
          page.url || final,
          "URL resolves to HTTP (insecure).",
          "Ensure all pages redirect to HTTPS.",
          final,
        ),
      );
    }
  }
  return findings;
}

/** Passive: URLs with redirect/url/next/return params pointing to external hosts (no request made). */
function passiveOpenRedirectRisk(pages, startUrl) {
  const findings = [];
  const startNetloc = (() => {
    try {
      return new URL(startUrl).host.toLowerCase();
    } catch {
      return "";
    }
  })();

  for (const page of pages) {
    const urlStr = (page.url || "").trim();
    if (!urlStr) continue;
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch {
      continue;
    }
    if (!parsed.search) continue;

    for (const paramName of parsed.searchParams.keys()) {
      if (!OPEN_REDIRECT_PARAMS.has(paramName)) continue;
      let matched = false;
      for (const value of parsed.searchParams.getAll(paramName)) {
        if (!value) continue;
        const trimmed = value.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) continue;
        try {
          const otherNetloc = new URL(trimmed).host.toLowerCase();
          if (otherNetloc && otherNetloc !== startNetloc) {
            findings.push(
              finding(
                "open_redirect_risk",
                "Low",
                urlStr,
                `Query parameter '${paramName}' contains external URL (potential open redirect).`,
                "Validate redirect targets to same origin or allowlist; do not redirect to user-controlled URLs.",
                trimmed.slice(0, 200),
              ),
            );
            matched = true;
            break;
          }
        } catch {
          /* not a valid absolute URL, skip */
        }
      }
      if (matched) break;
    }
  }

  return findings;
}

/** Findings for mixed content (HTTP resources loaded on HTTPS pages). */
function passiveMixedContent(pages, startUrl) {
  const findings = [];
  try {
    if (new URL(startUrl).protocol !== "https:") return findings;
  } catch {
    return findings;
  }

  for (const page of pages.filter(isSuccess)) {
    const mixed = page.seo?.mixedContentCount || 0;
    if (mixed <= 0) continue;
    findings.push(
      finding(
        "mixed_content",
        "High",
        page.url,
        `Page loads ${mixed} HTTP resource(s) over HTTPS (mixed content).`,
        "Load all resources over HTTPS to avoid mixed content and downgrade attacks.",
        String(mixed),
      ),
    );
  }

  return findings;
}

/**
 * Re-fetch a sample of already-crawled URLs and check for POST forms without
 * an obvious CSRF token, and query params that get reflected verbatim in the
 * response body. Passive — no crafted payloads are sent (see docs/ARCHITECTURE.md §5;
 * active probing is explicitly out of scope for this tool).
 */
async function passiveHtmlChecks(pages, startUrl, { maxUrlsToProbe = MAX_URLS_TO_PROBE } = {}) {
  const findings = [];
  let baseNetloc;
  try {
    baseNetloc = new URL(startUrl).host.toLowerCase();
  } catch {
    return findings;
  }

  const urls = [...new Set(pages.filter(isSuccess).map((p) => p.url))].slice(0, maxUrlsToProbe);

  for (const url of urls) {
    try {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        continue;
      }
      if (parsedUrl.host.toLowerCase() !== baseNetloc) continue;

      const res = await fetch(url, { headers: { "User-Agent": "WebHealthSecurityScan/1.0" } });
      const contentType = res.headers.get("content-type") || "";
      if (res.status !== 200 || !contentType.toLowerCase().includes("text/html")) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // Forms without CSRF token
      for (const form of $("form").toArray()) {
        const method = ($(form).attr("method") || "get").trim().toLowerCase();
        if (method !== "post") continue;
        const hasCsrf = $(form)
          .find("input[name]")
          .toArray()
          .some((input) => CSRF_PATTERN.test($(input).attr("name") || ""));
        if (!hasCsrf) {
          findings.push(
            finding(
              "form_without_csrf",
              "Medium",
              url,
              "POST form has no obvious CSRF token (hidden input with csrf/token in name).",
              "Add a CSRF token (e.g. hidden input or SameSite cookie) to prevent cross-site request forgery.",
            ),
          );
          break;
        }
      }

      // Reflected query param (passive: value appears verbatim in body)
      for (const [name, value] of parsedUrl.searchParams.entries()) {
        if (!value || value.length < 3 || value.length > 200) continue;
        if (["true", "false", "0", "1", "yes", "no"].includes(value.toLowerCase())) continue;
        const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const reflected = new RegExp(`>\\s*${escaped}\\s*<`).test(html) || new RegExp(`"\\s*${escaped}\\s*"`).test(html);
        if (reflected) {
          findings.push(
            finding(
              "reflected_param",
              "Low",
              url,
              `Query parameter '${name}' value may be reflected in response (XSS risk if unescaped).`,
              "Encode user input for HTML/JS context; use CSP and safe output encoding.",
              name,
            ),
          );
          break;
        }
      }
    } catch {
      continue;
    }
  }

  return findings;
}

/**
 * Run all passive security checks against a completed crawl. Mirrors the
 * reference's run_security_scan() with run_active always false — active
 * probing (crafted-payload injection) is explicitly out of scope, see
 * docs/ARCHITECTURE.md §5.
 */
export async function runSecurityScan(pages, startUrl, options = {}) {
  const findings = [
    ...passiveHeaders(pages),
    ...passiveHttps(pages),
    ...passiveOpenRedirectRisk(pages, startUrl),
    ...passiveMixedContent(pages, startUrl),
  ];

  findings.push(...(await passiveHtmlChecks(pages, startUrl, options)));

  return findings;
}
