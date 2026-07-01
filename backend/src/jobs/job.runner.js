import { crawl } from "../crawl/crawler.js";
import { checkSiteLevel } from "../analysis/siteLevel.js";
import { buildReport } from "../reporting/builder.js";
import { insertReport, insertCrawlRun, insertCrawlPages, updateCrawlRun } from "../db/repository.js";
import { createJob, patchJob } from "./job.store.js";

const CRAWL_OPTIONS = {
  maxPages: 30,
  maxDepth: 2,
  concurrency: 5,
  timeoutMs: 10000,
};

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
    updateCrawlRun(crawlRunId, { pagesCrawled: pages.length, crawlTimeS });

    patchJob(jobId, { status: "scoring", progress: { pagesCrawled: pages.length, pagesTotal: pages.length } });

    const report = buildReport({ startUrl: url, pages, crawlTimeS, siteLevel });

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
