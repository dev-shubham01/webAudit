import { getDb } from "./schema.js";

function rowToReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    siteName: row.site_name,
    status: row.status,
    generatedAt: row.generated_at,
    data: JSON.parse(row.data),
  };
}

function rowToReportSummary(row) {
  return {
    id: row.id,
    url: row.url,
    siteName: row.site_name,
    status: row.status,
    generatedAt: row.generated_at,
  };
}

function rowToJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    status: row.status,
    progress: row.progress ? JSON.parse(row.progress) : null,
    reportId: row.report_id,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function insertReport({ url, siteName, generatedAt, data, crawlRunId }) {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO reports (url, site_name, status, generated_at, data, crawl_run_id)
       VALUES (?, ?, 'done', ?, ?, ?)`,
    )
    .run(url, siteName ?? null, generatedAt, JSON.stringify(data), crawlRunId ?? null);

  return info.lastInsertRowid;
}

export function insertCrawlRun({ startUrl, createdAt }) {
  const db = getDb();
  const info = db
    .prepare(`INSERT INTO crawl_runs (start_url, created_at) VALUES (?, ?)`)
    .run(startUrl, createdAt);

  return info.lastInsertRowid;
}

export function updateCrawlRun(crawlRunId, { pagesCrawled, crawlTimeS }) {
  const db = getDb();
  db.prepare(`UPDATE crawl_runs SET pages_crawled = ?, crawl_time_s = ? WHERE id = ?`).run(
    pagesCrawled,
    crawlTimeS,
    crawlRunId,
  );
}

export function insertCrawlPages(crawlRunId, pages) {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO crawl_pages (crawl_run_id, url, final_url, status, depth, data)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertMany = db.transaction((rows) => {
    for (const page of rows) {
      insert.run(
        crawlRunId,
        page.url,
        page.finalUrl ?? null,
        String(page.status),
        page.depth ?? null,
        JSON.stringify(page),
      );
    }
  });
  insertMany(pages);
}

export function insertLighthouseRuns(crawlRunId, byUrl) {
  const entries = Object.entries(byUrl);
  if (!entries.length) return;
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR REPLACE INTO lighthouse_runs (crawl_run_id, url, data) VALUES (?, ?, ?)`,
  );
  const insertMany = db.transaction((rows) => {
    for (const [url, summary] of rows) insert.run(crawlRunId, url, JSON.stringify(summary));
  });
  insertMany(entries);
}

export function insertEdges(crawlRunId, edges) {
  if (!edges.length) return;
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO edges (crawl_run_id, from_url, to_url) VALUES (?, ?, ?)`,
  );
  const insertMany = db.transaction((rows) => {
    for (const [from, to] of rows) insert.run(crawlRunId, from, to);
  });
  insertMany(edges);
}

export function getReportById(id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(id);
  return rowToReport(row);
}

export function listReports() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, url, site_name, status, generated_at
       FROM reports ORDER BY id DESC`,
    )
    .all();

  return rows.map(rowToReportSummary);
}

export function insertJob({ id, url, status, createdAt }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO jobs (id, url, status, progress, report_id, error, created_at, updated_at)
     VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?)`,
  ).run(id, url, status, createdAt, createdAt);

  return getJobById(id);
}

export function getJobById(id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id);
  return rowToJob(row);
}

export function updateJob(id, patch) {
  const existing = getJobById(id);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  const db = getDb();
  db.prepare(
    `UPDATE jobs SET status = ?, progress = ?, report_id = ?, error = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    merged.status,
    merged.progress ? JSON.stringify(merged.progress) : null,
    merged.reportId ?? null,
    merged.error ?? null,
    new Date().toISOString(),
    id,
  );

  return getJobById(id);
}
