import { normalizeAndValidateUrl } from "../utils/urls.js";
import { startJob } from "./job.runner.js";
import { getJob } from "./job.store.js";
import { getReportById, listReports } from "../db/repository.js";

export function createReportJob(req, res) {
  const normalizedUrl = normalizeAndValidateUrl(req.body?.url);

  if (!normalizedUrl) {
    return res.status(400).json({ success: false, message: "Invalid URL" });
  }

  const job = startJob(normalizedUrl);
  return res.status(202).json({ jobId: job.id });
}

export function getJobStatus(req, res) {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  return res.json({
    status: job.status,
    progress: job.progress,
    reportId: job.reportId ?? null,
    error: job.error ?? null,
  });
}

export function getReport(req, res) {
  const reportId = Number(req.params.reportId);

  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ success: false, message: "Invalid report id" });
  }

  const report = getReportById(reportId);

  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  return res.json(report);
}

export function getReportList(req, res) {
  return res.json(listReports());
}
