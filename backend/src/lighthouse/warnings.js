/**
 * Maps Lighthouse audit IDs to detection method, affected metric,
 * severity, and a one-line actionable fix. Faithful port of the
 * reference's tools/warnings.py (AUDIT_MAP + PHRASE_TO_ID + diagnostics builder).
 */
const AUDIT_MAP = {
  "largest-contentful-paint": {
    detection: "Lighthouse audit largest-contentful-paint",
    primaryImpact: "LCP",
    secondaryImpacts: ["FID"],
    explanation:
      "Lighthouse measures the largest contentful paint from the trace; slow LCP usually means slow server, render-blocking resources, or large images.",
    oneLineFix:
      'Add <link rel="preload" as="image" href="/path/to/lcp-image"> or reduce server TTFB and render-blocking resources.',
    severity: "High",
  },
  "cumulative-layout-shift": {
    detection: "Lighthouse audit cumulative-layout-shift",
    primaryImpact: "CLS",
    secondaryImpacts: ["UX"],
    explanation:
      "CLS is computed from layout shift events in the trace; unstable layout is often caused by images/ads without dimensions or late-injected content.",
    oneLineFix:
      "Add width and height attributes to <img> (or CSS aspect-ratio) to reserve space and avoid layout shift.",
    severity: "High",
  },
  "total-blocking-time": {
    detection: "Lighthouse audit total-blocking-time",
    primaryImpact: "FID",
    secondaryImpacts: ["LCP", "UX"],
    explanation: "TBT sums blocking time after FCP; long tasks block the main thread and hurt interactivity.",
    oneLineFix: "Break up long tasks (code-split, defer non-critical JS) or reduce main-thread work.",
    severity: "High",
  },
  "first-contentful-paint": {
    detection: "Lighthouse audit first-contentful-paint",
    primaryImpact: "LCP",
    secondaryImpacts: ["UX"],
    explanation:
      "FCP is when the first text or image is painted; delayed by render-blocking CSS/JS and slow TTFB.",
    oneLineFix: "Reduce render-blocking resources (inline critical CSS, defer non-critical JS) and improve TTFB.",
    severity: "High",
  },
  "render-blocking-resources": {
    detection: "Lighthouse audit render-blocking-resources (network trace + first paint)",
    primaryImpact: "LCP",
    secondaryImpacts: ["FID", "UX"],
    explanation: "Lighthouse identifies stylesheets and scripts that block first paint in the critical path.",
    oneLineFix:
      'Add <link rel="preload" as="style" href="critical.css"> or inline critical CSS and defer non-critical JS.',
    severity: "High",
  },
  "unused-css-rules": {
    detection: "Lighthouse audit unused-css-rules",
    primaryImpact: "LCP",
    secondaryImpacts: ["FID"],
    explanation: "Large or unused CSS increases parse time and can block rendering.",
    oneLineFix: "Remove unused CSS or use critical CSS and load the rest asynchronously.",
    severity: "Medium",
  },
  "uses-responsive-images": {
    detection: "Lighthouse audit uses-responsive-images",
    primaryImpact: "LCP",
    secondaryImpacts: [],
    explanation: "Serving oversized images wastes bandwidth and can slow LCP.",
    oneLineFix: "Use srcset and sizes (or picture) to serve appropriately sized images.",
    severity: "Medium",
  },
  "uses-optimized-images": {
    detection: "Lighthouse audit uses-optimized-images",
    primaryImpact: "LCP",
    secondaryImpacts: [],
    explanation: "Unoptimized images (e.g. PNG where WebP is supported) increase payload and load time.",
    oneLineFix: "Serve images in modern formats (e.g. WebP/AVIF) with fallbacks.",
    severity: "Medium",
  },
  "efficient-animated-content": {
    detection: "Lighthouse audit efficient-animated-content",
    primaryImpact: "FID",
    secondaryImpacts: ["CLS", "UX"],
    explanation: "Animations using non-compositor properties (e.g. width/height) can cause main-thread jank.",
    oneLineFix: "Use CSS transform/opacity for animations or requestAnimationFrame for JS animations.",
    severity: "Medium",
  },
  "image-aspect-ratio": {
    detection: "Lighthouse audit image-aspect-ratio (or DOM: img without width/height)",
    primaryImpact: "CLS",
    secondaryImpacts: ["UX"],
    explanation:
      "Images without dimensions cause layout shift when they load; the audit checks for width/height or aspect-ratio.",
    oneLineFix: "Add width and height attributes to <img> (or CSS aspect-ratio) to reserve space.",
    severity: "High",
  },
  "preload-lcp-image": {
    detection: "Lighthouse audit preload-lcp-image",
    primaryImpact: "LCP",
    secondaryImpacts: [],
    explanation: "Preloading the LCP image can reduce LCP by starting the request earlier.",
    oneLineFix: 'Add <link rel="preload" as="image" href="/path/to/lcp-image"> for the LCP element.',
    severity: "High",
  },
  "document-title": {
    detection: "Lighthouse audit document-title",
    primaryImpact: "SEO",
    secondaryImpacts: ["UX"],
    explanation: "Missing or empty document title hurts SEO and tab identification.",
    oneLineFix: "Add a unique <title> tag (e.g. <title>Page Name | Site</title>).",
    severity: "Medium",
  },
  "meta-description": {
    detection: "Lighthouse audit meta-description",
    primaryImpact: "SEO",
    secondaryImpacts: ["UX"],
    explanation: "Missing meta description reduces snippet quality in search results.",
    oneLineFix: 'Add <meta name="description" content="..."> with a concise description.',
    severity: "Medium",
  },
  "link-text": {
    detection: "Lighthouse/axe: link has non-descriptive text",
    primaryImpact: "Accessibility",
    secondaryImpacts: ["UX"],
    explanation: "Links like 'click here' are not accessible to screen readers.",
    oneLineFix: "Use descriptive link text (e.g. 'Download report' instead of 'click here').",
    severity: "Medium",
  },
  "image-alt": {
    detection: "Lighthouse/axe: image missing alt",
    primaryImpact: "Accessibility",
    secondaryImpacts: ["SEO"],
    explanation: "Images without alt text are not announced by screen readers.",
    oneLineFix: 'Add alt attribute to <img> (use alt="" for decorative images).',
    severity: "High",
  },
  "color-contrast": {
    detection: "Lighthouse/axe: color contrast",
    primaryImpact: "Accessibility",
    secondaryImpacts: ["UX"],
    explanation: "Low contrast between text and background fails WCAG.",
    oneLineFix: "Increase contrast ratio (e.g. darker text or lighter background) to meet WCAG AA.",
    severity: "High",
  },
  "button-name": {
    detection: "axe: button or icon button has no accessible name",
    primaryImpact: "Accessibility",
    secondaryImpacts: ["UX"],
    explanation: "Buttons without a name are not announced by assistive tech.",
    oneLineFix: "Add aria-label or visible text to the button.",
    severity: "High",
  },
  label: {
    detection: "axe: form control missing label",
    primaryImpact: "Accessibility",
    secondaryImpacts: ["UX"],
    explanation: "Inputs without labels are not associated for screen readers.",
    oneLineFix: 'Add <label for="id"> or aria-label to the form control.',
    severity: "High",
  },
  "heading-order": {
    detection: "axe: heading levels skip or are out of order",
    primaryImpact: "Accessibility",
    secondaryImpacts: ["SEO"],
    explanation: "Headings should form a logical outline (h1 then h2, etc.).",
    oneLineFix: "Use heading levels in order (e.g. h1, then h2, no skipped levels).",
    severity: "Medium",
  },
  "duplicate-id": {
    detection: "axe: duplicate id attribute",
    primaryImpact: "Accessibility",
    secondaryImpacts: ["UX"],
    explanation: "Duplicate IDs break label/for and ARIA references.",
    oneLineFix: "Ensure each id value is unique in the document.",
    severity: "Medium",
  },
  "aria-allowed-attr": {
    detection: "axe: ARIA attribute not allowed on element",
    primaryImpact: "Accessibility",
    secondaryImpacts: [],
    explanation: "Invalid ARIA can confuse assistive technologies.",
    oneLineFix: "Remove or replace the invalid ARIA attribute per ARIA spec.",
    severity: "Medium",
  },
  "csp-xss": {
    detection: "Lighthouse audit csp-xss",
    primaryImpact: "SEO",
    secondaryImpacts: ["UX"],
    explanation: "Content Security Policy can mitigate XSS; missing or weak CSP is flagged.",
    oneLineFix: "Add a Content-Security-Policy header (or meta tag) with at least default-src and script-src.",
    severity: "Medium",
  },
};

const DEFAULT_ENTRY = {
  detection: "Lighthouse/axe audit or manual warning",
  primaryImpact: "UX",
  secondaryImpacts: [],
  explanation: "This warning was detected by the tool; see audit helpText for details.",
  oneLineFix: "Review the audit recommendation and fix the underlying issue.",
  severity: "Medium",
};

const PHRASE_TO_ID = [
  ["render-blocking", "render-blocking-resources"],
  ["largest contentful paint", "largest-contentful-paint"],
  ["lcp", "largest-contentful-paint"],
  ["cumulative layout shift", "cumulative-layout-shift"],
  ["cls", "cumulative-layout-shift"],
  ["total blocking time", "total-blocking-time"],
  ["tbt", "total-blocking-time"],
  ["first contentful paint", "first-contentful-paint"],
  ["fcp", "first-contentful-paint"],
  ["width", "image-aspect-ratio"],
  ["height", "image-aspect-ratio"],
  ["image without", "image-aspect-ratio"],
  ["dimensions", "image-aspect-ratio"],
  ["aspect-ratio", "image-aspect-ratio"],
  ["preload", "preload-lcp-image"],
  ["document title", "document-title"],
  ["meta description", "meta-description"],
  ["alt", "image-alt"],
  ["contrast", "color-contrast"],
  ["link text", "link-text"],
  ["button name", "button-name"],
  ["label", "label"],
  ["heading", "heading-order"],
  ["duplicate id", "duplicate-id"],
  ["aria", "aria-allowed-attr"],
  ["unused css", "unused-css-rules"],
  ["responsive image", "uses-responsive-images"],
  ["optimized image", "uses-optimized-images"],
];

function resolveEntry(auditId, title, helpText) {
  const aid = (auditId || "").trim().toLowerCase();
  if (aid && AUDIT_MAP[aid]) return AUDIT_MAP[aid];
  const text = `${title || ""} ${helpText || ""}`.toLowerCase();
  for (const [phrase, mappedId] of PHRASE_TO_ID) {
    if (text.includes(phrase) || aid.includes(phrase)) return AUDIT_MAP[mappedId] || DEFAULT_ENTRY;
  }
  return DEFAULT_ENTRY;
}

/** Return the primary_impact for an audit (used by lighthouse/runner.js top_failures). */
export function resolveImpact(auditId, title, helpText) {
  return resolveEntry(auditId, title, helpText).primaryImpact || "UX";
}

function evidenceFromAuditDetails(audit) {
  const evidence = [];
  const details = audit.details;
  if (!details || typeof details !== "object") return evidence;
  const items = details.items || details.nodes || [];
  if (!Array.isArray(items)) return evidence;
  for (const item of items.slice(0, 10)) {
    if (item && typeof item === "object") {
      if (typeof item.url === "string" && !item.url.startsWith("data:")) {
        evidence.push(item.url.slice(0, 500));
      }
      const selector = item.selector || item.node?.selector;
      if (selector) evidence.push(String(selector).slice(0, 200));
    } else if (typeof item === "string") {
      evidence.push(item.slice(0, 200));
    }
  }
  return evidence.slice(0, 20);
}

function estimatedImpactPlaceholder(primaryImpact) {
  switch (primaryImpact) {
    case "LCP":
      return "LCP reduction possible (preload/optimize LCP resource).";
    case "CLS":
      return "CLS reduction likely (reserve space for images/ads).";
    case "FID":
      return "TBT/FID improvement (reduce long tasks).";
    case "Accessibility":
      return "Accessibility score improvement.";
    case "SEO":
      return "SEO score improvement.";
    default:
      return "UX improvement.";
  }
}

/**
 * Convert a Lighthouse result (LHR) into the full diagnostics schema used by
 * the Lighthouse page's grouped-by-impact view. Mirrors parse_lighthouse_to_diagnostics.
 */
export function parseLighthouseToDiagnostics(lhr, { maxNodesInRefs = 10 } = {}) {
  const lr = lhr.lighthouseResult || lhr;
  const audits = lr.audits || {};
  const diagnostics = [];

  for (const [auditId, audit] of Object.entries(audits)) {
    if (!audit) continue;
    const score = audit.score;
    if (score != null && score >= 1) continue;

    const title = audit.title || auditId;
    const helpText = audit.helpText || "";
    let warning = title || auditId;
    if (helpText) warning = `${title}: ${helpText}`.slice(0, 200);

    const entry = resolveEntry(auditId, title, helpText);
    const evidence = evidenceFromAuditDetails(audit);

    const refs = { lighthouseAuditId: auditId };
    if (audit.details && typeof audit.details === "object") {
      const nodes = audit.details.items || audit.details.nodes;
      if (Array.isArray(nodes)) refs.nodes = nodes.slice(0, maxNodesInRefs);
    }

    diagnostics.push({
      warning,
      lighthouseAuditId: auditId,
      detectionMethod: entry.detection,
      primaryImpact: entry.primaryImpact,
      secondaryImpacts: entry.secondaryImpacts || [],
      evidence,
      severity: entry.severity,
      oneLineFix: entry.oneLineFix,
      detailedFix: (helpText || entry.explanation || "").slice(0, 300).trim() || null,
      estimatedImpact: estimatedImpactPlaceholder(entry.primaryImpact),
      references: refs,
    });
  }

  return diagnostics;
}
