# WebHealth Rewrite — Feature Documentation

Full documentation of all 15 pages from the reference project
(`reference/WebsiteProfiling-main`), what each shows, what backend data it
needs, and which [ROADMAP.md](./ROADMAP.md) phase ships it. See
[ARCHITECTURE.md](./ARCHITECTURE.md) for the technical decisions referenced
below (job-based API, SQLite schema, ML approximations, etc.).

## Summary table

| Page | What it shows | Backend data needed | Phase |
|---|---|---|---|
| Home | Portfolio of past crawls with health scores | `reports` list, category scores | 7 |
| Overview | KPIs, category scores, top pages, recommendations | `crawl_pages`, `reporting/categories.js` | 1 |
| Content | Per-page SEO/content field table | `analysis/seoExtract.js` | 1 |
| Issues | Aggregated warnings by category/priority | `analysis/pageAnalysis.js` warnings | 2 |
| Links | Per-page table + URL inspector (SEO/content/security tabs) | `crawl_pages`, `edges` | 2 |
| Redirects | Redirect chains table | link-check results | 2 |
| Lighthouse | Core Web Vitals, category scores, diagnostics | `lighthouse/runner.js` | 3 |
| Security | Findings list by severity | `security/scanner.js` | 4 |
| TechStack | Detected technologies by category | `analysis/techStack.js` | 5 |
| Gallery | Image grid from crawl | image URLs collected during crawl | 5 |
| ContentAnalytics | Word count/reading level/keywords/duplicates/language/anomalies | `ml/*` modules | 6 |
| Network | 3D link-structure graph | `graph/linkGraph.js` (edges/nodes) | 7 |
| Charts | Cross-cutting score visualizations | existing category scores | 8 |
| SqlPlayground | Ad-hoc SQL over one report | read-only SQLite snapshot endpoint | 9 (optional) |
| ModelLoader | Browser LLM chat lab | none (client-only) | 9 (optional) |

## Page-by-page detail

### Home (Phase 7)
Portfolio view of every site that's been crawled, shown as cards: health
score (0–100, a weighted blend of category scores and HTTP success rate),
URL count, status-code breakdown (2xx/3xx/4xx/5xx), last-crawl timestamp.
Filterable by site name/URL. Clicking a card navigates to that domain's
Overview page. Backed by `GET /api/reports`.

### Overview (Phase 1)
The main dashboard. Shows:
- Top KPIs: total URLs, success rate %, broken links, missing H1 count
- Content KPIs: median word count, OG-tag coverage %, tech count, response
  time percentiles
- Category scores as circular progress rings (Technical SEO, Core Web Vitals,
  Performance, HTML/Accessibility, Link Health, Mobile, Security)
- Insight charts: word-count distribution, response-time buckets, crawl depth,
  title/meta health, social preview coverage, MIME types, Lighthouse scores
- A recommendations list (bulleted, generated from category deductions)
- Top Pages table (paginated, ranked by inbound-link importance)
- Site config check: robots.txt/sitemap.xml presence and validity
- Optional report-diff view comparing against a previously selected crawl
  (new/removed/changed URLs) — later enhancement, not required for MVP

### Content (Phase 1)
Per-page SEO/content audit table: filters for missing H1, short/long meta
descriptions, thin content, multiple H1s, etc. Duplicate-content clusters
table at the top (populated once Phase 6 ships; empty/omitted until then).
Toggleable filter buttons drill into a paginated table of affected URLs.

### Issues (Phase 2)
Aggregates every warning produced by `analysis/pageAnalysis.js` across the
whole crawl, grouped by category (SEO/Performance/Security/etc.) and
filterable by priority (Critical/High/Medium/Low). Each issue card shows a
priority badge, the message, the affected URL, and a fix recommendation.
Charts: issues by category (bar), issues by priority (doughnut).

### Links (Phase 2)
The main crawl-results table: every crawled page with status, inbound-link
count, depth, response time, word count. Filters for status code, orphan
pages (0 inlinks), slow response time, thin/long content. Clicking a row
opens a full inspector with tabs: Overview, Page Analysis, SEO Issues,
Content Flags, Security, Recommendations — including that page's Lighthouse
data and any broken/redirecting links found on it.

### Redirects (Phase 2)
Simple table of `from URL → status → final URL`, plus a bar chart of status
code counts. Sourced from the same link-check pass as the Links page.

### Lighthouse (Phase 3)
Per-URL Lighthouse reports (mobile-first by default). Shows category score
rings (Performance, Accessibility, Best Practices, SEO), a multi-page
comparison table when more than one URL was tested, threshold bars for key
metrics (LCP, FID, CLS), "quick win" cards (easy fixes), and expandable/
searchable failing-audit details grouped by impact area (Core Web Vitals, UX,
SEO, etc.).

### Security (Phase 4)
Table of passive security findings grouped by type, filterable by severity
(Critical/High/Medium/Low/Info). Each finding shows a severity icon, the
finding type, a message, and a recommendation. Charts: findings by type (bar),
findings by severity (doughnut). See ARCHITECTURE.md §5 — active probing is
explicitly not part of this page.

### TechStack (Phase 5)
Detected technologies grouped into categories (CMS, JS Frameworks, CSS,
Analytics, Infrastructure, Fonts, Other), with a bar chart of detection counts
and sample URLs per detected technology.

### Gallery (Phase 5)
Masonry grid of images discovered during the crawl (content images, OG
images, Twitter Card images). Each tile shows the image, its source page, and
a usage-kind badge. Click to open a lightbox. Filterable by source.

### ContentAnalytics (Phase 6)
Content-quality comparison across pages: title-length and meta-description-
length distributions, content breadth. Tables for pages grouped by reading
level, keyword-frequency lists, and (per ARCHITECTURE.md §7) SimHash-based
duplicate clusters, `franc`-based language mix, and z-score/IQR-based anomaly
flags. **Note:** this page reports fewer signal types than the Python
original — no NER entity extraction, no semantic-similarity clusters (both
dropped from the core pipeline, see ARCHITECTURE.md §7).

### Network (Phase 7)
Interactive 3D force-directed graph of the site's internal link structure
(kept as a full 3D graph per the locked-in decision — no 2D simplification).
Node color reflects status (blue = 2xx, red = 4xx/5xx, gray = other). Supports
zoom/pan, node hover for title, and click-to-focus. Physics tuned by graph
size for performance on larger sites.

### Charts (Phase 8)
An ad-hoc charting page: status-code distribution, MIME types, crawl-depth
distribution, response-time distribution, word-count distribution — built
with `recharts` (no new charting dependency needed).

### SqlPlayground (Phase 9, optional)
A CodeMirror-based SQL editor for running ad-hoc queries against a single
report's data. In the rewrite this queries a dedicated read-only backend
endpoint that exposes a per-report SQLite snapshot — not an app-wide
client-side database, unlike the reference. Only built if there's appetite
after Phase 8; doesn't block or unlock anything else.

### ModelLoader (Phase 9, optional)
A browser-based AI lab: paste an LLM API key (Gemini/OpenAI), chat about the
report data, with tool-calling into the report's SQL/semantic-search
capabilities. Entirely client-side (Transformers.js for embeddings), no
backend work required if built. This is the most speculative page in the
reference — a different product surface (BYO-API-key chat assistant) rather
than a website-audit view — and is the easiest phase to drop entirely without
any impact on the rest of the roadmap.
