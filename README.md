# WebAudit AI - Backend

WebAudit AI is a SaaS website audit platform. Users submit a URL and receive a consolidated report that includes screenshot capture, runtime errors, SEO checks, and performance insights.

## Core Features

- **Screenshot capture** using Puppeteer
- **Browser diagnostics** including console errors and failed network requests
- **SEO analysis**:
  - page title
  - meta description
  - H1 audit
  - images missing `alt`
- **Performance analysis** using Lighthouse

## Architecture

This backend follows a **Feature-Based Architecture with internal layering** (not traditional MVC).

Each feature is self-contained and keeps its own route/controller/service responsibilities where applicable.

### Design Principles

- Separation of concerns
- Single responsibility per file
- `scan.service.js` acts as the orchestrator
- Modular, scalable code organization
- `async/await` with explicit error handling

## Folder Structure

```text
backend/
├── features/
│   ├── scan/
│   │   ├── scan.route.js
│   │   ├── scan.controller.js
│   │   └── scan.service.js
│   ├── puppeteer/
│   │   └── puppeteer.service.js
│   ├── seo/
│   │   └── seo.service.js
│   └── lighthouse/
│       └── lighthouse.service.js
├── utils/
└── server.js
```

## Request Flow

1. `scan.route.js` exposes the scan endpoint.
2. `scan.controller.js` validates request shape and handles HTTP concerns.
3. `scan.service.js` orchestrates feature services.
4. Specialized services (`puppeteer`, `seo`, `lighthouse`) return focused outputs.
5. Orchestrator merges all outputs into one scan response.

## API

### `POST /scan`

Runs a full audit for a single website URL.

**Request body**

```json
{
  "url": "https://example.com"
}
```

**Success response (200)**

```json
{
  "success": true,
  "url": "https://example.com",
  "screenshot": "base64-or-file-reference",
  "errors": {
    "console": [],
    "network": []
  },
  "seo": {
    "title": "",
    "metaDescription": "",
    "h1": [],
    "imagesWithoutAlt": []
  },
  "performance": {
    "lighthouseScore": 0
  }
}
```

**Validation error (400)**

```json
{
  "error": "url is required"
}
```

**Server error (500)**

```json
{
  "error": "Internal server error"
}
```

## Conventions for Future Development

- Add new capabilities as **feature modules** under `features/`.
- Keep orchestration in `scan.service.js`; do not move cross-feature coordination to controller/route files.
- Avoid combining unrelated responsibilities in a single file.
- Keep utility code in `utils/` and feature logic inside feature folders.