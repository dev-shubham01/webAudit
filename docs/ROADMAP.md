# WebHealth Rewrite — Phased Roadmap

This roadmap turns WebHealth from a single-page audit tool into a multi-page site
crawler/reporting platform matching the functionality and UI of the reference
project (`reference/WebsiteProfiling-main`), built with **React + Vite +
JavaScript** on the frontend and **Node.js/Express** on the backend.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md) for the technical decisions behind
this roadmap, and [FEATURES.md](./FEATURES.md) for a full page-by-page feature
breakdown.

## Baseline — what exists today

- Backend: one Express route, `POST /scan`, runs a single-page Puppeteer visit
  (screenshot, console/network errors), basic DOM-scraped SEO, one Lighthouse run
  (performance category only), image-size check (first 30 images), and a
  50-link broken-link check. Everything happens synchronously inside one HTTP
  request with a 120s hard timeout.
- Frontend: one `ScanContext` holding the last scan result in memory (no
  persistence), one `/dashboard` route rendering it.
- No crawler, no multi-page analysis, no database, no report history.

The 120-second timeout on the current `/scan` endpoint is a symptom, not a
constraint to design around — a real multi-page crawl can take minutes, so the
rewrite moves to a job-based API (see ARCHITECTURE.md §3) instead of raising the
timeout.

## Phase 0 — Foundations (S)

**Goal:** stand up the new backend skeleton and job infrastructure, and prove
the job-based API end-to-end, before any real analysis logic is built on top of it.

- Backend: Express app skeleton, `better-sqlite3` setup with `reports` and
  `jobs` tables only, `job.store.js` + `job.runner.js` that can run a
  **trivial** single-page fetch (reusing the current `puppeteer`/`seo` logic
  almost as-is) and write one row to `reports`.
- Frontend: new `ReportContext` wired to `POST /api/reports`,
  `GET /api/reports/jobs/:id`, and `GET /api/reports/:id`. Minimal UI — enter a
  URL, see a spinner, see the raw JSON result. No polish yet.
- `.cursor` rules updated to reflect the new crawler-based scope (see
  "Housekeeping" below) so they stop contradicting this roadmap.
- Unlocks: nothing user-facing yet, but de-risks the job/polling pattern before
  15 pages get built on top of it.

## Phase 1 — Crawler + Technical SEO/HTML analysis + Overview page (L)

**Goal:** replace the single-page Puppeteer scan with a real multi-page BFS
crawler and per-page SEO/content/accessibility extraction; ship the first real
dashboard page.

- Backend: `crawl/crawler.js` (BFS queue, concurrency-limited fetches,
  robots.txt aware, depth/page-count limits), `analysis/seoExtract.js` +
  `analysis/pageAnalysis.js` (title/meta/canonical/OG/Twitter tags, heading
  structure, image alt/lazy/dimension checks, hreflang, render-blocking
  script/stylesheet detection, ~15 heuristic warnings), `crawl_pages` table,
  `reporting/categories.js` scoring for Technical SEO, HTML/Accessibility, and
  Mobile categories, `reporting/builder.js` assembling the first version of the
  report payload.
- Frontend: **Overview** (category score cards, KPIs, top pages, recommendations)
  and **Content** (per-page SEO field table) pages, replacing the old
  single-scan Dashboard.
- Depends on: Phase 0's job/report plumbing.
- Size: **L** — the biggest single phase (full crawler + most of the
  per-page heuristics), but also the highest-leverage phase since nearly every
  later phase reads from `crawl_pages`.

## Phase 2 — Link health, redirects, Issues (M)

**Goal:** generalize the existing single-page link-checking logic into a
crawl-wide feature with a dedicated inspector page.

- Backend: extend the crawler to record outlinks/edges into `edges`/`nodes`
  tables; generalize the current broken/redirect link-checking logic to run
  against every crawled page's outlinks instead of one page's; Link Health
  category scoring.
- Frontend: **Links** (with a per-URL inspector: Overview / SEO & Social /
  Technical / Content / Page Analysis / Issues tabs), **Redirects**, and
  **Issues** (aggregated warnings across all pages, filterable by
  category/priority) pages.
- Depends on: Phase 1 (`crawl_pages`).

## Phase 3 — Lighthouse pipeline (M)

**Goal:** run Lighthouse across multiple crawled pages instead of one URL, and
surface real Core Web Vitals.

- Backend: extend the existing chrome-launcher pattern to loop over the top N
  crawled 200-OK pages, running full Lighthouse categories (not just
  performance); flatten results into `lh_runs`/`lh_page_summaries` tables;
  Core Web Vitals category scoring from real Lighthouse data.
- Frontend: **Lighthouse** page (score rings, diagnostics grouped by impact
  area, multi-page comparison table, quick-win cards); Overview's Core Web
  Vitals card upgrades from placeholder to real data.
- Depends on: Phase 1 (needs a list of crawled URLs to test).

## Phase 4 — Security scanning (S/M)

**Goal:** surface passive security findings as their own category and page.

- Backend: `security/scanner.js` — missing security headers (HSTS,
  X-Content-Type-Options, X-Frame-Options, CSP), HTTP-vs-HTTPS checks,
  open-redirect-risk query parameters, mixed content, and passive HTML
  re-checks (missing CSRF token on forms, reflected-param heuristics) —
  all using data already captured during the crawl, no extra probing.
  Security category scoring.
- Frontend: **Security** page (findings list, filterable by severity).
- Depends on: Phase 1 (response headers/final URLs already captured per page).
- **Explicitly out of scope:** active security probing (crafted-payload
  injection tests for XSS/SQLi/open-redirect). This carries real legal/ethical
  liability disproportionate to its value for this tool and is not part of
  this roadmap — see ARCHITECTURE.md §5 for reasoning. Revisit only as an
  explicit, clearly-labeled opt-in if ever needed.

## Phase 5 — Tech stack detection + Gallery (S)

**Goal:** two independent, low-effort, high-visual-payoff pages.

- Backend: `analysis/techStack.js` — signature/pattern matching against HTML,
  headers, and meta tags (no maintained Node Wappalyzer package exists — see
  ARCHITECTURE.md §6); image URL collection extended across all crawled pages
  (already partially built for a single page in the current `images.service.js`).
- Frontend: **TechStack** (detected technologies grouped by category) and
  **Gallery** (image grid sourced from content/OG/Twitter images) pages.
- Depends on: Phase 1 (needs HTML/headers per page).

## Phase 6 — Content analytics + keyword/duplicate/language signals (M)

**Goal:** the "content intelligence" category and its dedicated page, using
the JS-approximated versions of the reference's ML features (see
ARCHITECTURE.md §7 for the full approximation table).

- Backend: `analysis/contentAnalytics.js` (word count, reading level,
  content/HTML ratio), `ml/keywordExtract.js` (frequency-based, matches the
  reference's actual main-pipeline approach), `ml/duplicateDetect.js` (SimHash,
  a faithful port), `ml/languageDetect.js` (`franc`, a faithful equivalent),
  `ml/anomalyDetect.js` (z-score/IQR heuristic — an approximation, not a real
  IsolationForest); Content Intelligence category scoring.
- Frontend: **ContentAnalytics** page (word counts, reading levels, keyword
  tables, duplicate clusters, language mix, anomaly flags).
- Depends on: Phase 1 (page text already extracted during crawl).
- Note: this page will report fewer signal types than the Python original —
  no NER entities, no semantic-similarity clusters (see ARCHITECTURE.md §7).
  This phase is intentionally sequenced late since it's the most
  approximation-heavy and the easiest to descope further if time is tight.

## Phase 7 — Network graph + Home/portfolio (M)

**Goal:** the visually distinctive link-graph view and the multi-report
history/landing page.

- Backend: `graph/linkGraph.js` building nodes/edges (from data already stored
  since Phase 2) plus a degree-based or hand-rolled PageRank-style ranking;
  richer metadata on the `GET /api/reports` listing endpoint.
- Frontend: **Network** page (full 3D force graph via `3d-force-graph`, kept
  as in the reference — no simplification) and **Home** page (portfolio of
  past crawls with health scores).
- Depends on: Phase 2 (edges/nodes) and Phase 1 (report metadata).
- Note: Home has no hard technical dependency beyond Phase 0's `reports` table
  and could move earlier if a "list of past reports" landing page is wanted
  sooner for demo purposes — it's sequenced here for priority, not because
  it's blocked.

## Phase 8 — Charts (S)

**Goal:** a dedicated page charting trends/comparisons across categories (and,
if compare-mode is later built, across historical reports).

- Backend: none new — reads existing category scores.
- Frontend: **Charts** page using `recharts` (already a frontend dependency —
  no new charting library needed).
- Depends on: Phase 1 (category scores must exist).

## Phase 9 — Lab features: SqlPlayground + ModelLoader (L, optional)

**Goal:** if there's still appetite after Phase 8, port the two most
speculative reference pages.

- Backend: none required for ModelLoader (client-only, as in the reference);
  SqlPlayground needs a dedicated read-only endpoint exposing a per-report
  SQLite snapshot, not an app-wide client-side data layer.
- Frontend: **SqlPlayground** (CodeMirror SQL editor + `sql.js`, scoped to one
  report) and **ModelLoader** (Transformers.js browser chat/embeddings lab).
- Depends on: all prior phases (needs populated reports to be useful), and on
  a decision to actually build this phase — it doesn't unlock or block anything
  else, so it's safe to skip indefinitely.

## Housekeeping (done as part of Phase 0)

- `.cursor/rules/webhealth-product-operating-system.mdc` currently states
  "Do not build crawler, AI layer, monitoring, or complex out-of-scope
  systems" as the delivery focus — this directly contradicts this roadmap and
  is updated to point here instead.
- `.cursor/rules/backend-feature-architecture.mdc` keeps its route/controller/
  service split for HTTP-facing code, with a note that pipeline-internal
  modules (crawl/analysis/lighthouse/security/reporting/db) aren't HTTP-facing
  and don't need that wrapper.

## Sequencing notes

- Phases are ordered by data dependency: everything after Phase 1 reads from
  `crawl_pages`, so Phase 1 is the highest-leverage/highest-risk phase.
- Each phase is independently demoable — you can stop after any phase and have
  a working, shippable subset of the app.
- Sizes (S/M/L) are relative effort for a solo/small-team pace, not calendar
  estimates.
