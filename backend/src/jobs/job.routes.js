import { Router } from "express";
import {
  createReportJob,
  getJobStatus,
  getReport,
  getReportList,
} from "./job.controller.js";

const router = Router();

router.post("/", createReportJob);
router.get("/", getReportList);
// Must come before "/:reportId" so "jobs" isn't parsed as a report id.
router.get("/jobs/:jobId", getJobStatus);
router.get("/:reportId", getReport);

export default router;
