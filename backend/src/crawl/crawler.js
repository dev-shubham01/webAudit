import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { fetchPage } from "./fetchPage.js";
import { loadRobots } from "./robots.js";
import { extractLinks } from "./linkExtract.js";
import { extractSeo } from "../analysis/seoExtract.js";
import { analyzeHtml } from "../analysis/pageAnalysis.js";
import { detectTechStack } from "../analysis/techStack.js";
import { sameOrigin, normalizeStartUrl } from "../utils/urls.js";

const DEFAULTS = {
  maxPages: 30,
  maxDepth: 2,
  concurrency: 5,
  timeoutMs: 10000,
  ignoreRobots: false,
  allowExternal: false,
  userAgent: "WebHealthCrawler/1.0",
};

function emptyPage(url, status, depth, error) {
  return {
    url,
    depth,
    status,
    error: error || null,
    contentType: "",
    finalUrl: url,
    responseTimeMs: null,
    contentLength: 0,
    redirectChainLength: 0,
    headers: {},
    title: "",
    outlinksCount: 0,
    seo: null,
    pageAnalysis: null,
    techStack: [],
  };
}

async function processUrl(url, ctx) {
  const { start, opts, robots, depths, queue } = ctx;
  const depth = depths.get(url) ?? 0;

  if (!robots.isAllowed(url)) {
    return emptyPage(url, "blocked_by_robots", depth);
  }

  const fetched = await fetchPage(url, { timeoutMs: opts.timeoutMs, userAgent: opts.userAgent });
  if (fetched.status == null) {
    return emptyPage(url, "error", depth, fetched.error);
  }

  const page = {
    url,
    depth,
    status: fetched.status,
    error: null,
    contentType: fetched.contentType,
    finalUrl: fetched.finalUrl,
    responseTimeMs: fetched.responseTimeMs,
    contentLength: fetched.contentLength,
    redirectChainLength: fetched.redirectChainLength,
    headers: fetched.headers,
    title: "",
    outlinksCount: 0,
    seo: null,
    pageAnalysis: null,
    techStack: [],
  };

  if (fetched.html) {
    try {
      const $ = cheerio.load(fetched.html);
      const { title, links } = extractLinks($, fetched.finalUrl);
      page.title = title;
      page.outlinksCount = links.size;
      page.seo = extractSeo($, fetched.finalUrl, fetched.html);
      page.pageAnalysis = analyzeHtml(fetched.html, fetched.finalUrl, page.seo.canonicalUrl);
      page.techStack = detectTechStack($, fetched.headers);

      for (const link of links) {
        if (depths.has(link)) continue;
        if (!opts.allowExternal && !sameOrigin(link, start)) continue;
        if (opts.maxDepth != null && depth >= opts.maxDepth) continue;
        depths.set(link, depth + 1);
        queue.push(link);
      }
    } catch (error) {
      page.error = error?.message || "Page analysis failed";
    }
  }

  return page;
}

/**
 * BFS crawl of a site starting at startUrl. Mirrors the reference's
 * threaded Crawler (crawl/crawler.py), using a p-limit concurrency pool
 * instead of a thread pool since Node's fetch is already non-blocking.
 */
export async function crawl(startUrl, options = {}, hooks = {}) {
  const opts = { ...DEFAULTS, ...options };
  const start = normalizeStartUrl(startUrl);
  const robots = opts.ignoreRobots ? { isAllowed: () => true } : await loadRobots(start, opts.userAgent);

  const depths = new Map([[start, 0]]);
  const queue = [start];
  const results = [];
  const limit = pLimit(opts.concurrency);
  const startedAt = performance.now();
  let dispatched = 0;

  const ctx = { start, opts, robots, depths, queue };

  return new Promise((resolve) => {
    function trySettle() {
      if (dispatched === results.length && (queue.length === 0 || dispatched >= opts.maxPages)) {
        resolve({ pages: results, crawlTimeS: (performance.now() - startedAt) / 1000 });
      }
    }

    function pump() {
      while (queue.length && dispatched < opts.maxPages) {
        const url = queue.shift();
        dispatched += 1;
        limit(() => processUrl(url, ctx))
          .then((page) => {
            results.push(page);
            hooks.onProgress?.({
              pagesCrawled: results.length,
              pagesTotal: Math.min(opts.maxPages, dispatched + queue.length),
            });
          })
          .finally(() => {
            pump();
            trySettle();
          });
      }
      trySettle();
    }

    pump();
  });
}
