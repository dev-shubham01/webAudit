import { randomUUID } from "node:crypto";
import { insertJob, getJobById, updateJob } from "../db/repository.js";

/**
 * Job state lives in the `jobs` SQLite table (not an in-memory map) so it
 * survives process restarts. better-sqlite3 is synchronous and local, so
 * there's no meaningful latency cost at this project's scale.
 */
export function createJob(url) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  return insertJob({ id, url, status: "queued", createdAt });
}

export function getJob(id) {
  return getJobById(id);
}

export function patchJob(id, patch) {
  return updateJob(id, patch);
}
