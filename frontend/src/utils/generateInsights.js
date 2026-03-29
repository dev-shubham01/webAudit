/**
 * Turn raw scan payloads into prioritized, actionable insight cards.
 * FCP / LCP are expected in milliseconds (Lighthouse-style); CLS is unitless.
 */
export function generateInsights({
  seo,
  performance,
  consoleErrors,
  networkErrors,
}) {
  const insights = [];
  const consoles = Array.isArray(consoleErrors) ? consoleErrors : [];
  const networks = Array.isArray(networkErrors) ? networkErrors : [];

  if (seo && typeof seo === "object") {
    if (seo.metaDescription === "Missing") {
      insights.push({
        type: "SEO",
        severity: "high",
        message: "Missing meta description",
        fix: "Add a meta description under 160 characters with relevant keywords",
      });
    }

    const h1Count = Number(seo?.h1?.count);
    if (Number.isFinite(h1Count)) {
      if (h1Count === 0) {
        insights.push({
          type: "SEO",
          severity: "high",
          message: "No H1 tag found",
          fix: "Add a single H1 tag to define page structure",
        });
      } else if (h1Count > 1) {
        insights.push({
          type: "SEO",
          severity: "medium",
          message: "Multiple H1 tags detected",
          fix: "Use only one H1 for better SEO",
        });
      }
    }

    const missingAlt = Number(seo?.images?.missingAlt);
    if (Number.isFinite(missingAlt) && missingAlt > 0) {
      insights.push({
        type: "SEO",
        severity: "medium",
        message: "Some images are missing alt attributes",
        fix: "Add descriptive alt text to all images",
      });
    }
  }

  const m = performance?.metrics;
  if (m && typeof m === "object") {
    const lcp = Number(m.lcp);
    if (Number.isFinite(lcp) && lcp > 2500) {
      insights.push({
        type: "Performance",
        severity: "medium",
        message: "Largest Contentful Paint is slow",
        fix: "Optimize large images and reduce render-blocking resources",
      });
    }

    const fcp = Number(m.fcp);
    if (Number.isFinite(fcp) && fcp > 2000) {
      insights.push({
        type: "Performance",
        severity: "medium",
        message: "First Contentful Paint is slow",
        fix: "Improve server response time and optimize critical CSS",
      });
    }

    const cls = Number(m.cls);
    if (Number.isFinite(cls) && cls > 0.1) {
      insights.push({
        type: "Performance",
        severity: "medium",
        message: "Layout shift detected",
        fix: "Set size attributes for images and avoid dynamic content shifts",
      });
    }
  }

  if (consoles.length > 0) {
    insights.push({
      type: "Error",
      severity: "high",
      message: "JavaScript errors detected",
      fix: "Fix console errors to avoid broken functionality",
    });
  }

  if (networks.length > 0) {
    insights.push({
      type: "Error",
      severity: "high",
      message: "Failed network requests detected",
      fix: "Check API endpoints and network responses",
    });
  }

  return insights;
}
