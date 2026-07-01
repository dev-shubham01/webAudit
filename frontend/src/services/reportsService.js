import { API_BASE_URL } from "../config/api.js";

async function parseJsonOrThrow(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

export async function startCrawl(url) {
  const res = await fetch(`${API_BASE_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  return parseJsonOrThrow(res);
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE_URL}/api/reports/jobs/${jobId}`);
  return parseJsonOrThrow(res);
}

export async function getReport(reportId) {
  const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}`);
  return parseJsonOrThrow(res);
}

export async function listReports() {
  const res = await fetch(`${API_BASE_URL}/api/reports`);
  return parseJsonOrThrow(res);
}
