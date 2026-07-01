import pLimit from "p-limit";

const REQUEST_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 5;
const MAX_RETRIES = 1;
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Accept: "text/html,application/xhtml+xml",
};

function isRedirectStatus(status) {
  return status >= 300 && status < 400;
}

function isBlockedStatus(status) {
  return status === 401 || status === 403 || status === 429;
}

function getRedirectUrl(response, currentUrl) {
  try {
    const location = response?.headers?.get?.("location");
    if (!location) return null;
    return new URL(location, currentUrl).href;
  } catch {
    return null;
  }
}

async function requestWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "manual",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRedirects(url) {
  let currentUrl = url;
  let redirects = 0;

  for (;;) {
    const response = await requestWithTimeout(currentUrl);
    const status = Number(response?.status) || 0;

    if (!isRedirectStatus(status) || redirects >= MAX_REDIRECTS) return response;

    const nextUrl = getRedirectUrl(response, currentUrl);
    if (!nextUrl) return response;

    redirects += 1;
    currentUrl = nextUrl;
  }
}

function classifyErrorAsUnknown(error) {
  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (name.includes("abort")) return true;

  // DNS/connection/network-block style failures should not be treated as broken links.
  return (
    message.includes("enotfound") ||
    message.includes("eai_again") ||
    message.includes("dns") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("blocked") ||
    message.includes("econnrefused") ||
    message.includes("econnreset")
  );
}

async function checkLinkStatus(url) {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    attempt += 1;

    try {
      const response = await fetchWithRedirects(url);
      const status = Number(response?.status) || 0;

      if (status >= 200 && status < 400) return { url, status, result: "success" };
      if (isBlockedStatus(status)) return { url, status, result: "unknown" };
      if (status >= 400) return { url, status, result: "broken" };
      return { url, status: null, result: "unknown" };
    } catch (error) {
      if (classifyErrorAsUnknown(error)) return { url, status: "unknown", result: "unknown" };
      if (attempt <= MAX_RETRIES) continue;
      return { url, status: null, result: "broken" };
    }
  }

  return { url, status: null, result: "unknown" };
}

/**
 * Check a list of URLs (concurrency-limited, redirect-following) and
 * classify each as success/broken/unknown. Generalizes the reference's
 * single-page checker (backend/features/links/links.service.js) to run
 * across every link discovered during a crawl, not just one page's.
 */
export async function checkLinks(urls, { concurrency = 10 } = {}) {
  const limit = pLimit(concurrency);
  return Promise.all(urls.map((url) => limit(() => checkLinkStatus(url))));
}
