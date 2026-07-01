import { runPuppeteerScan } from "../../features/puppeteer/puppeteer.service.js";
import { insertReport } from "../db/repository.js";
import { createJob, patchJob } from "./job.store.js";

/**
 * Phase 0: a "crawl" is a single-page fetch reusing the existing Puppeteer/SEO
 * service. Real multi-page crawling replaces this in Phase 1 (see docs/ROADMAP.md).
 */
async function runJob(jobId, url) {
  try {
    patchJob(jobId, { status: "crawling", progress: { pagesCrawled: 0, pagesTotal: 1 } });

    const scanResult = await runPuppeteerScan(url);

    patchJob(jobId, { status: "scoring", progress: { pagesCrawled: 1, pagesTotal: 1 } });

    const siteName = new URL(url).hostname;
    const generatedAt = new Date().toISOString();

    const reportId = insertReport({
      url,
      siteName,
      generatedAt,
      data: {
        siteName,
        url,
        generatedAt,
        summary: { pagesCrawled: 1 },
        pages: [
          {
            url,
            seo: scanResult.seo,
            links: scanResult.links,
            images: scanResult.images,
            consoleErrors: scanResult.consoleErrors,
            networkErrors: scanResult.networkErrors,
            isBlocked: scanResult.isBlocked ?? false,
            screenshot: scanResult.screenshot,
          },
        ],
      },
    });

    patchJob(jobId, {
      status: "done",
      reportId,
      progress: { pagesCrawled: 1, pagesTotal: 1 },
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
