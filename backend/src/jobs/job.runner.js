import { crawl } from "../crawl/crawler.js";
import { checkSiteLevel } from "../analysis/siteLevel.js";
import { checkLinks } from "../crawl/linkChecker.js";
import { buildEdges } from "../graph/linkGraph.js";
import { runLighthouseOnPages } from "../lighthouse/runner.js";
import { runSecurityScan } from "../security/scanner.js";
import { groupDuplicates } from "../ml/duplicateDetect.js";
import { summarizeLanguages } from "../ml/languageDetect.js";
import { detectAnomalies } from "../ml/anomalyDetect.js";
import { buildReport } from "../reporting/builder.js";
import {
  insertReport,
  insertCrawlRun,
  insertCrawlPages,
  insertEdges,
  insertLighthouseRuns,
  updateCrawlRun,
} from "../db/repository.js";
import { createJob, patchJob } from "./job.store.js";

const CRAWL_OPTIONS = {
  maxPages: 30,
  maxDepth: 2,
  concurrency: 5,
  timeoutMs: 10000,
};

// Mirrors the reference's single-page link checker's cap (MAX_LINKS_TO_CHECK)
// applied crawl-wide: only links that weren't themselves crawled (external,
// or beyond depth/page limits) need a separate check.
const MAX_OUTLINKS_TO_CHECK = 50;

// Each Lighthouse run launches its own Chrome instance sequentially
// (~15-20s/page), so this is capped well below the reference's
// lighthouse_max_pages=20 default for reasonable crawl turnaround.
const MAX_LIGHTHOUSE_PAGES = 5;

function selectLighthousePages(pages) {
  return pages
    .filter((p) => p.status === 200)
    .slice(0, MAX_LIGHTHOUSE_PAGES)
    .map((p) => p.finalUrl || p.url);
}

function collectUncrawledOutlinks(pages) {
  const crawledUrls = new Set();
  for (const p of pages) {
    crawledUrls.add(p.url);
    if (p.finalUrl) crawledUrls.add(p.finalUrl);
  }

  const uncrawled = new Set();
  for (const p of pages) {
    const links = [...(p.pageAnalysis?.internalLinks || []), ...(p.pageAnalysis?.externalLinks || [])];
    for (const link of links) {
      if (!crawledUrls.has(link)) uncrawled.add(link);
    }
  }
  return [...uncrawled].slice(0, MAX_OUTLINKS_TO_CHECK);
}

async function runJob(jobId, url) {
  try {
    patchJob(jobId, { status: "crawling", progress: { pagesCrawled: 0, pagesTotal: CRAWL_OPTIONS.maxPages } });

    const crawlRunId = insertCrawlRun({ startUrl: url, createdAt: new Date().toISOString() });

    const [{ pages, crawlTimeS }, siteLevel] = await Promise.all([
      crawl(url, CRAWL_OPTIONS, {
        onProgress: (progress) => patchJob(jobId, { status: "crawling", progress }),
      }),
      checkSiteLevel(url),
    ]);

    patchJob(jobId, { status: "analyzing", progress: { pagesCrawled: pages.length, pagesTotal: pages.length } });

    insertCrawlPages(crawlRunId, pages);

    const edges = buildEdges(pages);
    insertEdges(crawlRunId, edges);

    patchJob(jobId, {
      status: "checking_links",
      progress: { pagesCrawled: pages.length, pagesTotal: pages.length },
    });

    const uncrawledOutlinks = collectUncrawledOutlinks(pages);
    const externalLinkChecks = await checkLinks(uncrawledOutlinks, { concurrency: 10 });

    updateCrawlRun(crawlRunId, { pagesCrawled: pages.length, crawlTimeS });

    const lighthousePages = selectLighthousePages(pages);
    patchJob(jobId, {
      status: "lighthouse",
      progress: { pagesCrawled: 0, pagesTotal: lighthousePages.length },
    });

    const lighthouseByUrl = await runLighthouseOnPages(lighthousePages, {}, {
      onProgress: (progress) => patchJob(jobId, { status: "lighthouse", progress }),
    });
    insertLighthouseRuns(crawlRunId, lighthouseByUrl);

    patchJob(jobId, {
      status: "security_scan",
      progress: { pagesCrawled: pages.length, pagesTotal: pages.length },
    });

    const securityFindings = await runSecurityScan(pages, url);

    patchJob(jobId, { status: "scoring", progress: { pagesCrawled: pages.length, pagesTotal: pages.length } });

    const mlBundle = {
      contentDuplicates: groupDuplicates(pages),
      languageSummary: summarizeLanguages(pages),
      anomalies: detectAnomalies(pages),
    };

    const report = buildReport({
      startUrl: url,
      pages,
      crawlTimeS,
      siteLevel,
      edges,
      externalLinkChecks,
      lighthouseByUrl,
      securityFindings,
      mlBundle,
    });

    const reportId = insertReport({
      url,
      siteName: report.siteName,
      generatedAt: report.generatedAt,
      data: report,
      crawlRunId,
    });

    patchJob(jobId, {
      status: "done",
      reportId,
      progress: { pagesCrawled: pages.length, pagesTotal: pages.length },
    });
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    patchJob(jobId, { status: "error", error: error?.message || "Job failed" });
  }
}

export function startJob(url) {
  const job = createJob(url);

  // Fire and forget: job.store holds progress, the client polls for it.
  runJob(job.id, url);

  return job;
}
