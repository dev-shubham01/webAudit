/**
 * Turn raw scan payloads into prioritized, actionable insight cards.
 * FCP / LCP are expected in milliseconds (Lighthouse-style); CLS is unitless.
 */
export function generateInsights({
  seo,
  performance,
  consoleErrors,
  networkErrors,
  links,
}) {
  const insights = [];
  const consoles = Array.isArray(consoleErrors) ? consoleErrors : [];
  const networks = Array.isArray(networkErrors) ? networkErrors : [];
  const normalizedLinks = links && typeof links === "object" ? links : null;

  if (seo && typeof seo === "object") {
    if (seo.metaDescription === "Missing") {
      insights.push({
        type: "SEO",
        severity: "high",
        message: "Your page is missing a meta description.",
        why: "Search engines may show random page text, which can reduce click-through rate.",
        fix: "Add a concise meta description (about 120-160 characters) that clearly explains the page.",
      });
    }

    const h1Count = Number(seo?.h1?.count);
    if (Number.isFinite(h1Count)) {
      if (h1Count === 0) {
        insights.push({
          type: "SEO",
          severity: "high",
          message: "No H1 heading was found on the page.",
          why: "The H1 helps search engines and users understand the page's main topic.",
          fix: "Add one clear H1 near the top of the page that describes the primary content.",
        });
      } else if (h1Count > 1) {
        insights.push({
          type: "SEO",
          severity: "medium",
          message: "Multiple H1 headings were detected.",
          why: "Too many H1s can dilute content hierarchy and make topic signals less clear.",
          fix: "Keep one primary H1 and convert additional H1s to H2/H3 subheadings.",
        });
      }
    }

    const missingAlt = Number(seo?.images?.missingAlt);
    if (Number.isFinite(missingAlt) && missingAlt > 0) {
      insights.push({
        type: "SEO",
        severity: "medium",
        message: "Some images are missing alt text.",
        why: "Missing alt text hurts accessibility and removes image context for search engines.",
        fix: "Add short, descriptive alt text for meaningful images and empty alt text for decorative ones.",
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
        message: "Largest Contentful Paint (LCP) is slower than recommended.",
        why: "A slow LCP delays when users see the main content and can increase bounce rate.",
        fix: "Compress large media, preload the hero asset, and reduce render-blocking CSS/JS.",
      });
    }

    const fcp = Number(m.fcp);
    if (Number.isFinite(fcp) && fcp > 2000) {
      insights.push({
        type: "Performance",
        severity: "medium",
        message: "First Contentful Paint (FCP) is taking too long.",
        why: "Users wait longer before seeing any visual feedback from your page.",
        fix: "Improve server response time, inline critical CSS, and defer non-critical scripts.",
      });
    }

    const cls = Number(m.cls);
    if (Number.isFinite(cls) && cls > 0.1) {
      insights.push({
        type: "Performance",
        severity: "medium",
        message: "Noticeable layout shifts were detected.",
        why: "Unexpected movement can cause accidental clicks and frustrate users.",
        fix: "Set fixed width/height for media and reserve space for dynamic content like banners or ads.",
      });
    }
  }

  if (consoles.length > 0) {
    insights.push({
      type: "Error",
      severity: "high",
      message: "JavaScript errors were found in the browser console.",
      why: "Console errors can break features and create a poor user experience.",
      fix: "Review stack traces, fix runtime errors, and re-test key user flows.",
    });
  }

  if (networks.length > 0) {
    insights.push({
      type: "Error",
      severity: "high",
      message: "Some network requests failed during page load.",
      why: "Failed requests can leave parts of the UI empty or non-functional.",
      fix: "Check failed endpoints, status codes, CORS rules, and backend availability.",
    });
  }

  const brokenLinks = Array.isArray(normalizedLinks?.brokenLinks)
    ? normalizedLinks.brokenLinks
    : [];
  if (brokenLinks.length > 0) {
    insights.push({
      type: "SEO",
      severity: "high",
      message: "Broken links detected",
      why: "Broken links hurt SEO and user experience",
      fix: "Fix or remove links returning 4xx/5xx",
    });
  }

  const totalLinks = Number(normalizedLinks?.totalLinks) || 0;
  if (totalLinks >= 30) {
    insights.push({
      type: "Info",
      severity: "low",
      message: "This page contains many links.",
      why: "A high link count can make link quality harder to maintain over time.",
      fix: "Regularly validate important links and prioritize fixing broken destination URLs.",
    });
  }

  return insights;
}
