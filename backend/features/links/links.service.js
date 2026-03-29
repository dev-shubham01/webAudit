const MAX_LINKS_TO_CHECK = 50;
const REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_CONCURRENCY = 10;
const MAX_REDIRECTS = 5;
const MAX_RETRIES = 1;
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Accept: "text/html,application/xhtml+xml",
};

const getLinksFallback = () => ({
  totalLinks: 0,
  checkedLinks: 0,
  brokenLinks: [],
  successCount: 0,
  unknownLinks: [],
});

const shouldIgnoreHref = (href) => {
  if (typeof href !== "string") {
    return true;
  }

  const value = href.trim();
  if (!value) {
    return true;
  }

  const lower = value.toLowerCase();
  return (
    lower.startsWith("javascript:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  );
};

const normalizeToAbsoluteUrl = (href, baseUrl) => {
  try {
    return new URL(href, baseUrl).href;
  } catch (error) {
    void error;
    return null;
  }
};

const mapWithConcurrencyLimit = async (items, concurrency, worker) => {
  const safeConcurrency = Math.max(1, Number(concurrency) || 1);
  const results = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  };

  const workers = Array.from(
    { length: Math.min(safeConcurrency, items.length) },
    () => runWorker(),
  );

  await Promise.all(workers);
  return results;
};

const isRedirectStatus = (status) => status >= 300 && status < 400;

const isBlockedStatus = (status) => status === 401 || status === 403 || status === 429;

const getRedirectUrl = (response, currentUrl) => {
  try {
    const location = response?.headers?.get?.("location");
    if (!location) {
      return null;
    }
    return new URL(location, currentUrl).href;
  } catch (error) {
    void error;
    return null;
  }
};

const requestWithTimeout = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

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
};

const fetchWithRedirects = async (url) => {
  let currentUrl = url;
  let redirects = 0;

  while (true) {
    const response = await requestWithTimeout(currentUrl);
    const status = Number(response?.status) || 0;

    if (!isRedirectStatus(status)) {
      return response;
    }

    if (redirects >= MAX_REDIRECTS) {
      return response;
    }

    const nextUrl = getRedirectUrl(response, currentUrl);
    if (!nextUrl) {
      return response;
    }

    redirects += 1;
    currentUrl = nextUrl;
  }
};

const classifyErrorAsUnknown = (error) => {
  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (name.includes("abort")) {
    return true;
  }

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
};

const checkLinkStatus = async (url) => {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    attempt += 1;

    try {
      const response = await fetchWithRedirects(url);
      const status = Number(response?.status) || 0;

      if (status >= 200 && status < 400) {
        return {
          url,
          status,
          result: "success",
        };
      }

      if (isBlockedStatus(status)) {
        return {
          url,
          status,
          result: "unknown",
        };
      }

      if (status >= 400) {
        return {
          url,
          status,
          result: "broken",
        };
      }

      return {
        url,
        status: null,
        result: "unknown",
      };
    } catch (error) {
      const isUnknown = classifyErrorAsUnknown(error);
      if (isUnknown) {
        return {
          url,
          status: "unknown",
          result: "unknown",
        };
      }

      if (attempt <= MAX_RETRIES) {
        continue;
      }

      return {
        url,
        status: null,
        result: "broken",
      };
    }
  }

  try {
    return {
      url,
      status: null,
      result: "unknown",
    };
  } catch (error) {
    void error;
    return {
      url,
      status: null,
      result: "unknown",
    };
  }
};

const extractNormalizedUniqueLinks = async (page) => {
  const baseUrl = page.url();
  const rawLinks = await page.evaluate(() => {
    try {
      const anchors = Array.from(document.querySelectorAll("a[href]") || []);
      return anchors
        .map((anchor) =>
          typeof anchor?.getAttribute === "function" ? anchor.getAttribute("href") : "",
        )
        .filter((href) => typeof href === "string");
    } catch (error) {
      void error;
      return [];
    }
  });

  const uniqueAbsoluteLinks = [];
  const seen = new Set();

  for (const href of rawLinks) {
    if (shouldIgnoreHref(href)) {
      continue;
    }

    const normalized = normalizeToAbsoluteUrl(href.trim(), baseUrl);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    uniqueAbsoluteLinks.push(normalized);
  }

  return uniqueAbsoluteLinks;
};

export async function analyzeLinks(page) {
  try {
    if (!page || typeof page.evaluate !== "function" || typeof page.url !== "function") {
      return getLinksFallback();
    }

    const allLinks = await extractNormalizedUniqueLinks(page);
    const linksToCheck = allLinks.slice(0, MAX_LINKS_TO_CHECK);

    const results = await mapWithConcurrencyLimit(
      linksToCheck,
      DEFAULT_CONCURRENCY,
      async (url) => checkLinkStatus(url),
    );

    const brokenLinks = results
      .filter((result) => result?.result === "broken")
      .map((result) => ({
        url: result.url,
        status: result.status,
      }));

    const unknownLinks = results
      .filter((result) => result?.result === "unknown")
      .map((result) => ({
        url: result.url,
        status: result.status,
      }));

    const successCount = results.filter((result) => result?.result === "success").length;

    return {
      totalLinks: allLinks.length,
      checkedLinks: linksToCheck.length,
      brokenLinks,
      successCount,
      unknownLinks,
    };
  } catch (error) {
    void error;
    return getLinksFallback();
  }
}
