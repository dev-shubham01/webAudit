# WebHealth Rewrite — Architecture

Technical decisions behind the [ROADMAP.md](./ROADMAP.md) phases. Stack:
**React + Vite + JavaScript** (frontend), **Node.js + Express** (backend,
separate server), fresh rewrite of the backend pipeline modeled on
`reference/WebsiteProfiling-main`'s Python package, translated to Node.

## 1. Why a fresh backend, not an extension of the current one

The current backend (`backend/features/{scan,puppeteer,lighthouse,seo,images,links}`)
is single-page-scan shaped: one Puppeteer visit, synchronous response, no
crawl queue, no storage. The rewrite needs a queue-based multi-page crawler,
persistent multi-report storage, and a job-oriented API — different enough in
shape that a fresh module layout (below) is clearer than retrofitting the
existing services. That said, two pieces of working logic are lifted directly
rather than rewritten:

- `backend/features/lighthouse/lighthouse.service.js` — its chrome-launcher +
  `lighthouse` npm package invocation pattern is correct and reusable, just
  needs to loop over N pages instead of one.
- `backend/features/links/links.service.js` — its concurrency-limited link
  checker generalizes cleanly from "check 50 links on one page" to "check
  outlinks across every crawled page."

## 2. Backend module layout

Mirrors the reference's `website_profiling/` package structure, translated to
Node:

```
backend/src/
  server.js                      # express app bootstrap, route mounting
  jobs/
    job.store.js                 # job state (in-memory Map + `jobs` table for history)
    job.runner.js                # orchestrates crawl -> analysis -> lighthouse -> security -> report per job
    job.routes.js / job.controller.js
  crawl/
    crawler.js                   # BFS queue + concurrency pool
    robots.js                    # robots.txt fetch/parse wrapper
    fetchPage.js                 # single URL fetch (status, headers, timing, html)
    linkExtract.js               # cheerio-based <a> extraction + normalization
  analysis/
    seoExtract.js                # title/meta/canonical/OG/Twitter/headings/images
    pageAnalysis.js              # link classification, hreflang, render-blocking, ~15 warnings
    contentAnalytics.js          # word count, reading level, content/html ratio, keyword extraction
    techStack.js                 # signature-based tech detection
  lighthouse/
    runner.js                    # chrome-launcher + lighthouse npm pkg, multi-page loop
    schema.js                    # LHR -> flattened audit rows
  security/
    scanner.js                   # passive checks: headers, HTTPS, open-redirect params, mixed content
    activeProbes.js              # NOT IMPLEMENTED — placeholder only, see §5
  ml/
    duplicateDetect.js           # SimHash + fuzzy match
    anomalyDetect.js             # z-score/IQR statistical outlier heuristic
    languageDetect.js            # franc/franc-min
    keywordExtract.js            # frequency-based keyword extraction
  graph/
    linkGraph.js                 # build edges/nodes, degree-based ranking (PageRank approximation)
  reporting/
    categories.js                # 0-100 scoring per category
    builder.js                   # assembles final report JSON payload
  db/
    schema.js                    # better-sqlite3 schema init
    repository.js                # read/write helpers, thin wrapper over better-sqlite3
  utils/
    concurrency.js                # p-limit-based pool helper
    urls.js                       # URL normalization helpers
```

Pipeline-internal modules (`crawl/`, `analysis/`, `lighthouse/`, `security/`,
`ml/`, `graph/`, `reporting/`, `db/`) are not HTTP-facing and don't need the
route/controller/service split — that split still applies to `jobs/` (the one
HTTP-facing feature) per the existing `.cursor/rules/backend-feature-architecture.mdc`.

## 3. API shape: job-based, not request/response

A multi-page crawl can take minutes — too long for a single HTTP
request/response cycle (this is exactly why the current `/scan` endpoint needs
a 120s hard timeout). The rewrite uses a job-based API instead:

- `POST /api/reports` — body `{ url, options }` → creates a job, returns
  `{ jobId }` immediately (202 Accepted).
- `GET /api/reports/jobs/:jobId` — returns
  `{ status: "queued"|"crawling"|"analyzing"|"lighthouse"|"scoring"|"done"|"error", progress: { pagesCrawled, pagesTotal }, reportId?, error? }`.
  Frontend polls this every 1-2s while a job is in flight.
- `GET /api/reports/:reportId` — the finished report JSON payload.
- `GET /api/reports` — list of past reports (id, url, generatedAt, siteName)
  for the Home page.

Job runner: a single in-process async function chain (crawl → per-page
analysis → lighthouse-on-pages → security scan → ML approximations → build
report → write to SQLite → mark job done). An in-memory `Map<jobId, jobState>`
plus a `jobs` SQLite table (so job history survives restarts) is enough at
this scale — no BullMQ/Redis needed. `job.runner.js` is structured so a real
queue could be swapped in later without touching route/controller code, but
that's not needed now.

## 4. Storage: better-sqlite3

**Decision: `better-sqlite3`**, not plain JSON files, even though this is a
small project.

Why SQLite over JSON files:
- Multi-report history (the Home page) is a trivial
  `SELECT * FROM reports ORDER BY id DESC` instead of hand-rolling a JSON-file
  index/manifest.
- Relational querying for the Links inspector, Network graph edges, and the
  optional SQL Playground lab feature — these are naturally tabular (one row
  per crawled page, one row per edge) and painful to filter/sort/paginate from
  a single giant JSON blob loaded fully into memory per request.
- Crash-safe atomic writes come for free; JSON files need manual
  write-then-rename to avoid partial-write corruption if the process dies
  mid-crawl.
- `better-sqlite3` is synchronous, embedded, zero-ops — a good fit for a
  single-process Express app. Trade-off: it's a native addon (node-gyp
  compiled), so deploy environments need matching prebuilt binaries or a build
  toolchain — a minor, well-trodden cost (Docker/Vercel/Render all support it).

Schema (mirrors the reference's `db/storage.py` tables, adapted):

| Table | Purpose |
|---|---|
| `crawl_runs` | one row per crawl run (start URL, timestamp) |
| `crawl_pages` | one row per crawled page — SEO/content/accessibility/perf fields (analog of the reference's `crawl_results`) |
| `edges` | directed link graph: `(crawl_run_id, from_url, to_url)` |
| `nodes` | per-URL graph metadata: in-degree / ranking score |
| `reports` | one row per finished report — metadata + JSON blob of the full assembled payload |
| `jobs` | job status/progress history, survives restarts |
| `lh_runs` | raw Lighthouse result (LHR JSON) per page |
| `lh_page_summaries` | flattened summary per URL (category scores, key metrics) |
| `security_findings` | one row per security finding (type, severity, url, message) |

Frontend never touches SQLite directly — it only talks to the REST API
(§2 below explains why this differs from the reference's approach).

## 5. Security scanning: passive checks only

Built (all trivial, using data already captured during the crawl):
- Missing security headers (HSTS, X-Content-Type-Options, X-Frame-Options, CSP)
- HTTP-vs-HTTPS on final URL
- Open-redirect-risk query parameter names (`redirect`, `url`, `next`,
  `return`, `redir`, `destination`, `goto`, `to`, etc.)
- Mixed content (HTTP resources loaded on an HTTPS page)
- Passive HTML re-checks: missing CSRF token on forms, reflected-query-param
  heuristics — these reuse HTML already fetched during the crawl, no extra
  requests needed

**Explicitly excluded: active probing** (crafted-payload injection tests for
reflected XSS, open-redirect, or SQL injection). The reference project's own
docs gate this behind "only use on sites you're authorized to test" — for a
personal/side-project tool, this adds legal/ethical liability disproportionate
to its value versus the passive checks above. If ever wanted, it should be a
hard opt-in per scan with an explicit on-screen warning, never a default.

## 6. Tech stack detection

No maintained Node/npm Wappalyzer package exists — `wappalyzer` and
`wappalyzer-core` are both explicitly marked deprecated by their own
maintainers (README: "no longer being maintained, use wappalyzer.com/api
instead"). `simple-wappalyzer` wraps the same deprecated core plus a heavier
dependency chain (`happy-dom`).

**Decision:** build signature/pattern matching (against HTML, response
headers, and meta tags) as the **primary** approach, not a fallback — this is
exactly what the reference project itself does when Wappalyzer isn't
available. Port its pattern list directly (roughly 35 `(name, source, pattern)`
tuples covering WordPress, Drupal, Shopify, Next.js, React, Vue, Angular,
jQuery, Bootstrap, Tailwind, Google Analytics/GTM, Cloudflare, Nginx, etc.).
Simple string matching, zero dependency risk, trivially extensible by adding
rows as new frameworks emerge — better long-term maintainability than
depending on an unmaintained package, at the cost of not auto-tracking
Wappalyzer's crowd-sourced signature database (an acceptable trade for a side
project).

## 7. ML/enrichment approximations

The reference's Python ML pipeline uses sentence-transformers, spaCy,
scikit-learn, langdetect, rapidfuzz, and KeyBERT — none of which have faithful
Node equivalents for the heavier features. Decision, feature by feature:

| Feature | Python approach | JS decision | Verdict |
|---|---|---|---|
| Duplicate detection | Hand-rolled SimHash (~40 lines, no exotic deps) + `rapidfuzz` fuzzy merge | Port SimHash directly (pure algorithm — MD5-hash tokens, weighted bit-vector) + `string-similarity`/`fastest-levenshtein` for fuzzy merge | **Build faithfully** — not really "ML," it's a hashing algorithm |
| Language detection | `langdetect` | `franc`/`franc-min` — same n-gram statistical approach | **Build faithfully** |
| Keyword extraction | Word-frequency counter in the main pipeline (KeyBERT is a *separate* opt-in CLI tool, not part of the report payload) | Same frequency-based approach | **Build faithfully**; drop the separate KeyBERT-based CLI utility (not used by any of the 15 views) |
| Anomaly detection | scikit-learn IsolationForest + StandardScaler | z-score/IQR outlier flagging per numeric column (word count, response time, image count, etc.) | **Approximate** — no faithful Node IsolationForest equivalent exists; label clearly in the UI as a simpler heuristic, not multivariate ML |
| NER | spaCy trained models | No lightweight faithful JS equivalent (`compromise`/`wink-nlp` are far weaker) | **Drop from core pipeline** — not surfaced as its own page in the reference anyway, low payoff for the porting effort |
| Semantic similarity | sentence-transformers embeddings | No faithful lightweight server-side Node equivalent without a real ML runtime (ONNX Runtime + quantized model — heavy for this project's scale). The reference itself only uses real embeddings **client-side** (Transformers.js, in the optional ModelLoader lab page) | **Drop from core server-side pipeline** — consistent with the reference's own architecture, not a regression. Revisit only inside the optional Phase 9 lab feature if built |

Net effect: 3 of 6 features (duplicate detection, language detection, keyword
extraction) get faithful/near-faithful ports with zero exotic dependencies.
Anomaly detection gets a clearly-labeled simpler heuristic. NER and
server-side embeddings are dropped from the core pipeline.

## 8. Frontend data model: REST API, not sql.js-in-browser

The reference frontend loads a static `report.db` SQLite file and queries it
client-side via `sql.js` (WASM). That pattern exists because the reference's
Python backend is a **CLI tool**, not a server — there's no always-on process
to query at request time, so the only option is to hand the browser the whole
database file.

This rewrite has a persistent Express backend by design, so that constraint
doesn't apply. **Decision: fetch from the Express REST API.** The backend
builds the same kind of report JSON payload and serves it via
`GET /api/reports/:id`; dedicated endpoints (`GET /api/reports/:id/pages`,
`GET /api/reports/:id/edges`) can serve tabular slices where needed (Links
inspector, Network graph). This avoids shipping the sql.js WASM bundle to
every visitor, avoids re-implementing query logic twice (once in the report
builder, once in hand-written client-side SQL strings), and avoids the schema-
drift defensiveness the reference's `loadReportDb.js` has to handle because
its whole DB file gets regenerated per crawl.

### `ReportContext` (replaces the current `ScanContext`)

```
frontend/src/context/ReportContext.jsx
  - reportList: [{ id, url, siteName, generatedAt, status }]   // GET /api/reports
  - selectedReportId, setSelectedReportId
  - data: full report payload for selectedReportId              // GET /api/reports/:id
  - loading, error
  - compareReportId, setCompareReportId, compareData, reportDiff  // later phase
  - startNewCrawl(url, options) -> jobId                        // POST /api/reports
  - jobStatus                                                    // polls GET /api/reports/jobs/:jobId while a crawl is running
```

This absorbs the reference's "portfolio of past crawls" + "select which
report to view" + "compare two reports" responsibilities via REST instead of
direct SQL. `ThemeProvider` ports over close to as-is (pure client-side theme
toggle, no data dependency).

### Library carry-over

- Keep `recharts` (already a frontend dependency) — no need to add Chart.js,
  recharts covers the same category-score bars/lines/radar charts.
- `3d-force-graph` (Network page) has no good recharts substitute — add it
  only in the Network phase (Phase 7), since it's a standalone dependency.
- `sql.js`, CodeMirror (`@codemirror/*`, `@uiw/react-codemirror`), and
  `@xenova/transformers` should **not** be added unless/until the optional
  Phase 9 lab pages (SqlPlayground, ModelLoader) are actually built — they're
  the single biggest bundle-size/complexity cost in the reference's dependency
  list.

## 9. Crawler implementation notes

- **Concurrency:** `p-limit`-based promise pool, not `worker_threads` or a
  thread pool. The reference's `ThreadPoolExecutor` exists because Python's
  `requests` library is blocking I/O; Node's `fetch` is already non-blocking,
  so a promise pool achieves the same parallelism without OS threads.
  `worker_threads` is for CPU-bound work — at this project's scale (tens to
  low-hundreds of pages per crawl), single-threaded cheerio parsing is fast
  enough that thread overhead isn't worth it. The current `links.service.js`
  already hand-rolls a similar concurrency-limited mapper; either extract it
  into `utils/concurrency.js` or replace it with the well-tested `p-limit`.
- **HTML parsing:** `cheerio` — a direct, actively-maintained analog to
  BeautifulSoup+lxml. Nearly all of the reference's parsing logic (link
  extraction, meta/OG/canonical extraction, heading sequence, image
  alt/lazy/dimension checks, hreflang, script/stylesheet resource hints,
  ARIA counting, mixed-content detection) translates close to 1:1 to cheerio
  selectors.
- **robots.txt:** `robots-parser` npm package — direct analog to Python's
  `urllib.robotparser`.
- **BFS queue:** a plain array/Set-based queue and visited-set (as in the
  reference's `crawler.py`) — no need for a job queue library given the
  single-process, no-Redis design.
