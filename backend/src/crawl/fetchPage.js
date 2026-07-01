const DEFAULT_USER_AGENT = "WebHealthCrawler/1.0";
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const HTML_CONTENT_TYPE = /text\/html|application\/xhtml\+xml/i;

/**
 * Fetch a single URL, manually following redirects so the chain length is
 * observable (mirrors the reference's requests.Session().get(..., allow_redirects=True)
 * plus resp.history). Returns status/headers/timing/html for the final response.
 */
export async function fetchPage(url, opts = {}) {
  const { timeoutMs = 12000, userAgent = DEFAULT_USER_AGENT, maxRedirects = 5 } = opts;

  let currentUrl = url;
  let redirectChainLength = 0;
  const startedAt = performance.now();

  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetch(currentUrl, {
          redirect: "manual",
          headers: { "User-Agent": userAgent },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (REDIRECT_STATUSES.has(response.status) && hop < maxRedirects) {
        const location = response.headers.get("location");
        if (!location) return await toResult(response, currentUrl, redirectChainLength, startedAt);
        currentUrl = new URL(location, currentUrl).toString();
        redirectChainLength += 1;
        continue;
      }

      return await toResult(response, currentUrl, redirectChainLength, startedAt);
    }
  } catch (error) {
    return { status: null, error: error?.message || "Fetch failed", finalUrl: currentUrl };
  }

  return { status: null, error: "Too many redirects", finalUrl: currentUrl };
}

async function toResult(response, finalUrl, redirectChainLength, startedAt) {
  const responseTimeMs = Math.round(performance.now() - startedAt);
  const contentType = response.headers.get("content-type") || "";
  const isHtml = response.status === 200 && HTML_CONTENT_TYPE.test(contentType);
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    status: response.status,
    contentType,
    html: isHtml ? buffer.toString("utf-8") : null,
    responseTimeMs,
    contentLength: buffer.byteLength,
    finalUrl,
    redirectChainLength,
    headers: {
      cacheControl: response.headers.get("cache-control") || "",
      etag: response.headers.get("etag") || "",
      xRobotsTag: response.headers.get("x-robots-tag") || "",
      strictTransportSecurity: response.headers.get("strict-transport-security") || "",
      xContentTypeOptions: response.headers.get("x-content-type-options") || "",
      xFrameOptions: response.headers.get("x-frame-options") || "",
      contentSecurityPolicy: response.headers.get("content-security-policy") || "",
      server: response.headers.get("server") || "",
    },
  };
}
