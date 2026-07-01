import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = process.env.WEBHEALTH_DB_PATH || path.join(DATA_DIR, "webhealth.db");

let db = null;

function createSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      site_name TEXT,
      status TEXT NOT NULL DEFAULT 'done',
      generated_at TEXT NOT NULL,
      data TEXT NOT NULL,
      crawl_run_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL,
      progress TEXT,
      report_id INTEGER,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crawl_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      pages_crawled INTEGER,
      crawl_time_s REAL
    );

    CREATE TABLE IF NOT EXISTS crawl_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crawl_run_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      final_url TEXT,
      status TEXT,
      depth INTEGER,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_crawl_pages_run ON crawl_pages (crawl_run_id);

    CREATE TABLE IF NOT EXISTS edges (
      crawl_run_id INTEGER NOT NULL,
      from_url TEXT NOT NULL,
      to_url TEXT NOT NULL,
      PRIMARY KEY (crawl_run_id, from_url, to_url)
    );
    CREATE INDEX IF NOT EXISTS idx_edges_run ON edges (crawl_run_id);
  `);
}

export function getDb() {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  createSchema(db);

  return db;
}
