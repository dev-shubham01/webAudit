/**
 * Report categories: Technical SEO, Core Web Vitals, Performance,
 * HTML/Accessibility, Link Health, Mobile, Security, Content intelligence.
 * Faithful port of the reference's reporting/categories.py, operating on
 * plain arrays of crawled page objects (see crawl/crawler.js) instead of
 * a pandas DataFrame.
 */

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const RESPONSE_TIME_SLOW_MS = 2000;
const REDIRECT_CHAIN_LONG = 2;

function issue(message, { url = "", priority = "Medium", recommendation = "" } = {}) {
  return { message, url, priority, recommendation };
}

function sortIssues(issues) {
  return [...issues].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99),
  );
}

function recommendationsOf(issues) {
  return [...new Set(issues.map((i) => i.recommendation).filter(Boolean))];
}

function scoreFromDeductions(maxScore, deductions) {
  const total = deductions.reduce((sum, d) => sum + d, 0);
  return Math.max(0, maxScore - total);
}

function isSuccess(page) {
  return typeof page.status === "number" && page.status >= 200 && page.status < 300;
}

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function categoryTechnicalSeo(pages, siteLevel) {
  const issues = [];
  const deductions = [];
  const successPages = pages.filter(isSuccess);

  if (!siteLevel.robotsPresent) {
    issues.push(
      issue("robots.txt is missing or unreachable.", {
        priority: "High",
        recommendation: "Add a robots.txt at the site root to control crawler access.",
      }),
    );
    deductions.push(15);
  }
  if (!siteLevel.sitemapPresent) {
    issues.push(
      issue("sitemap.xml (or sitemap index) is missing or unreachable.", {
        priority: "High",
        recommendation: "Add a sitemap at /sitemap.xml or link it in robots.txt.",
      }),
    );
    deductions.push(10);
  } else if (!siteLevel.sitemapValid) {
    issues.push(
      issue("sitemap.xml could not be parsed as valid XML.", {
        priority: "Medium",
        recommendation: "Ensure sitemap is valid XML and follows sitemaps.org format.",
      }),
    );
    deductions.push(5);
  }

  if (successPages.length > 0) {
    const missingCanon = successPages.filter((p) => !(p.seo?.canonicalUrl || "").trim());
    if (missingCanon.length > 0) {
      issues.push(
        issue("Missing canonical URL.", {
          url: missingCanon[0].url,
          priority: "Medium",
          recommendation: "Add a canonical link tag pointing to the preferred URL.",
        }),
      );
      deductions.push(Math.min(15, missingCanon.length * 2));
    }

    const mismatched = successPages.find((p) => {
      const canon = (p.seo?.canonicalUrl || "").trim().replace(/\/$/, "");
      if (!canon) return false;
      return p.url.replace(/\/$/, "") !== canon;
    });
    if (mismatched) {
      const canon = mismatched.seo.canonicalUrl.trim().replace(/\/$/, "");
      issues.push(
        issue(`Canonical points to different URL: ${canon}`, {
          url: mismatched.url,
          priority: "High",
          recommendation: "Set canonical to this page URL or the preferred duplicate.",
        }),
      );
      deductions.push(10);
    }

    const noindexCount = successPages.filter((p) => p.seo?.noindex).length;
    if (noindexCount > 0) {
      issues.push(
        issue(`${noindexCount} page(s) have noindex.`, {
          priority: noindexCount > 5 ? "High" : "Medium",
          recommendation:
            "Remove noindex from pages that should be indexed, or keep for intentional no-index pages.",
        }),
      );
      deductions.push(Math.min(15, noindexCount * 3));
    }

    if (successPages.length > 1) {
      const groups = new Map();
      for (const p of successPages) {
        const key = `${p.seo?.title || ""}|${p.seo?.metaDescription || ""}`;
        groups.set(key, (groups.get(key) || 0) + 1);
      }
      const dupGroups = [...groups.values()].filter((n) => n > 1);
      if (dupGroups.length > 0) {
        issues.push(
          issue(
            `Possible duplicate content: ${dupGroups.length} group(s) of pages share same title and meta description.`,
            {
              priority: "Medium",
              recommendation:
                "Differentiate titles and meta descriptions, or use canonicals to designate the preferred URL.",
            },
          ),
        );
        deductions.push(10);
      }
    }

    const ogPct = successPages.filter((p) => (p.seo?.ogTitle || "").trim()).length / successPages.length;
    if (ogPct < 0.5) {
      issues.push(
        issue(`Open Graph tags missing on ${Math.round((1 - ogPct) * 100)}% of pages.`, {
          priority: "Medium",
          recommendation: "Add og:title, og:description, and og:image meta tags for social sharing.",
        }),
      );
      deductions.push(5);
    }

    const twPct = successPages.filter((p) => (p.seo?.twitterCard || "").trim()).length / successPages.length;
    if (twPct < 0.2) {
      issues.push(
        issue(`Twitter Card tags missing on ${Math.round((1 - twPct) * 100)}% of pages.`, {
          priority: "Low",
          recommendation: "Add twitter:card meta tags for better Twitter/X sharing previews.",
        }),
      );
      deductions.push(3);
    }

    const withSchema = successPages.filter((p) => p.seo?.hasSchema).length;
    if (withSchema === 0) {
      issues.push(
        issue("No structured data (JSON-LD or microdata) detected.", {
          priority: "Low",
          recommendation: "Add schema.org markup (e.g. Organization, Article) for rich results.",
        }),
      );
      deductions.push(5);
    }

    const missingLang = successPages.filter((p) => !(p.pageAnalysis?.htmlLang || "").trim()).length;
    if (missingLang > 0 && successPages.length >= 3) {
      const ratio = missingLang / successPages.length;
      if (ratio > 0.1) {
        issues.push(
          issue(`${missingLang} page(s) missing <html lang> (of ${successPages.length} OK responses).`, {
            priority: ratio > 0.5 ? "Medium" : "Low",
            recommendation: 'Add <html lang="..."> matching the primary language of each page.',
          }),
        );
        deductions.push(Math.min(10, Math.max(2, Math.floor(missingLang / 5))));
      }
    }
  }

  return {
    id: "technical_seo",
    name: "Technical SEO",
    score: scoreFromDeductions(100, deductions),
    issues: sortIssues(issues),
    recommendations: recommendationsOf(issues),
  };
}

function categoryCoreWebVitals() {
  const issues = [
    issue("LCP, FID, and CLS are not measured by this tool.", {
      priority: "Medium",
      recommendation: "Use Lighthouse or PageSpeed Insights to measure LCP, FID, and CLS.",
    }),
  ];
  return {
    id: "core_web_vitals",
    name: "Core Web Vitals",
    score: null,
    issues,
    recommendations: ["Use Lighthouse or PageSpeed Insights to measure LCP, FID, and CLS."],
  };
}

function categoryCoreWebVitalsFromLighthouse(lighthouseSummary) {
  const issues = [];
  const recommendations = [];
  let perfScore = null;
  const mm = lighthouseSummary.medianMetrics || {};
  if (typeof mm.performanceScore === "number") {
    perfScore = Math.max(0, Math.min(100, Math.round(mm.performanceScore * 100)));
  }
  for (const f of lighthouseSummary.topFailures || []) {
    const aid = f.id || "";
    const helpText = (f.helpText || "").slice(0, 200);
    const msg = aid ? `${aid}: ${helpText}` : helpText || "Audit failed";
    issues.push(
      issue(msg, {
        priority: (f.score || 0) < 0.5 ? "High" : "Medium",
        recommendation: "See the Lighthouse report for the fix.",
      }),
    );
  }
  if (!issues.length && perfScore !== null && perfScore < 80) {
    recommendations.push("Improve Core Web Vitals (LCP, CLS, TBT) per Lighthouse recommendations.");
  }
  return {
    id: "core_web_vitals",
    name: "Core Web Vitals",
    score: perfScore,
    issues: sortIssues(issues),
    recommendations: recommendations.length
      ? recommendations
      : ["Core Web Vitals measured by Lighthouse; see median metrics in the Lighthouse summary."],
  };
}

function categoryPerformance(pages) {
  const successPages = pages.filter(isSuccess);
  if (successPages.length === 0) {
    return { id: "performance", name: "Performance", score: 0, issues: [], recommendations: [] };
  }

  const issues = [];
  const deductions = [];

  const responseTimes = successPages.map((p) => p.responseTimeMs || 0);
  const slow = responseTimes.filter((rt) => rt > RESPONSE_TIME_SLOW_MS).length;
  if (slow > 0) {
    issues.push(
      issue(`${slow} page(s) have server response time > ${RESPONSE_TIME_SLOW_MS / 1000}s.`, {
        priority: slow > 5 ? "High" : "Medium",
        recommendation: "Optimize server response time (TTFB): caching, CDN, or backend tuning.",
      }),
    );
    deductions.push(Math.min(20, slow * 2));
  }
  const validRt = responseTimes.filter((rt) => rt > 0).sort((a, b) => a - b);
  if (validRt.length > 5) {
    const p95 = quantile(validRt, 0.95);
    if (p95 > 3000) {
      issues.push(
        issue(`95th percentile response time is ${Math.round(p95)}ms (over 3s).`, {
          priority: "High",
          recommendation: "Investigate slowest pages; consider CDN, server-side caching, or database optimization.",
        }),
      );
      deductions.push(10);
    }
  }

  const totalImgs = successPages.reduce((sum, p) => sum + (p.seo?.imagesTotal || 0), 0);
  if (totalImgs > 0) {
    const noLazy = successPages.reduce((sum, p) => sum + (p.seo?.imgWithoutLazy || 0), 0);
    if (noLazy > totalImgs * 0.5) {
      issues.push(
        issue("Many images without lazy loading.", {
          priority: "Medium",
          recommendation: "Add loading='lazy' to off-screen images.",
        }),
      );
      deductions.push(10);
    }
    const noDims = successPages.reduce((sum, p) => sum + (p.seo?.imgWithoutDimensions || 0), 0);
    if (noDims > 0) {
      issues.push(
        issue(`${noDims} image(s) without width/height (can cause CLS).`, {
          priority: "High",
          recommendation: "Set width and height attributes on img tags to avoid layout shift.",
        }),
      );
      deductions.push(10);
    }
  }

  const noCache = successPages.filter((p) => !(p.headers?.cacheControl || "").trim()).length;
  if (noCache > successPages.length * 0.5) {
    issues.push(
      issue("Many pages without Cache-Control header.", {
        priority: "Medium",
        recommendation: "Set Cache-Control (and optionally ETag) for static and cacheable pages.",
      }),
    );
    deductions.push(10);
  }

  const totalScripts = successPages.reduce((sum, p) => sum + (p.pageAnalysis?.scriptUrls?.length || 0), 0);
  if (totalScripts > successPages.length * 10) {
    issues.push(
      issue("High number of script tags across pages.", {
        priority: "Low",
        recommendation: "Consider bundling and code-splitting to reduce JS payload.",
      }),
    );
    deductions.push(5);
  }

  return {
    id: "performance",
    name: "Performance",
    score: scoreFromDeductions(100, deductions),
    issues: sortIssues(issues),
    recommendations: recommendationsOf(issues),
  };
}

function categoryHtmlAccessibility(pages) {
  const successPages = pages.filter(isSuccess);
  if (successPages.length === 0) {
    return { id: "html_accessibility", name: "HTML & Accessibility", score: 0, issues: [], recommendations: [] };
  }

  const issues = [];
  const deductions = [];

  const zeroH1 = successPages.filter((p) => (p.seo?.h1Count ?? -1) === 0).length;
  const multiH1 = successPages.filter((p) => (p.seo?.h1Count ?? 0) > 1).length;
  if (zeroH1 > 0) {
    issues.push(
      issue(`${zeroH1} page(s) missing H1.`, {
        priority: "High",
        recommendation: "Add exactly one H1 per page describing the main content.",
      }),
    );
    deductions.push(Math.min(20, zeroH1 * 3));
  }
  if (multiH1 > 0) {
    issues.push(
      issue(`${multiH1} page(s) have multiple H1s.`, {
        priority: "Medium",
        recommendation: "Use a single H1 per page; use H2–H6 for subsections.",
      }),
    );
    deductions.push(Math.min(10, multiH1 * 2));
  }

  const skippedPages = successPages.filter((p) =>
    p.pageAnalysis?.warnings?.some((w) => w.id === "skipped_heading_level"),
  );
  if (skippedPages.length > 0) {
    issues.push(
      issue("Skipped heading level (e.g. H1 then H3).", {
        url: skippedPages[0].url,
        priority: "Medium",
        recommendation: "Use heading levels in order (H1, H2, H3) without skipping.",
      }),
    );
    deductions.push(Math.min(15, skippedPages.length * 5));
  }

  const totalImgs = successPages.reduce((sum, p) => sum + (p.seo?.imagesTotal || 0), 0);
  const missingAlt = successPages.reduce((sum, p) => sum + (p.seo?.imagesWithoutAlt || 0), 0);
  if (totalImgs > 0 && missingAlt > 0) {
    issues.push(
      issue(`${missingAlt} image(s) without alt (or aria-label).`, {
        priority: "High",
        recommendation: "Add meaningful alt text to all images; use alt='' for decorative images.",
      }),
    );
    deductions.push(Math.min(15, missingAlt * 2));
  }

  const veryThin = successPages.filter((p) => {
    const wc = p.seo?.wordCount || 0;
    return wc > 0 && wc < 100;
  }).length;
  if (veryThin > 0) {
    issues.push(
      issue(`${veryThin} page(s) with very thin content (under 100 words).`, {
        priority: "High",
        recommendation: "Expand thin pages with meaningful content (aim for 300+ words).",
      }),
    );
    deductions.push(Math.min(15, veryThin * 3));
  }

  const complexPages = successPages.filter((p) => (p.seo?.readingLevel || 0) > 14).length;
  if (complexPages > 0) {
    issues.push(
      issue(`${complexPages} page(s) have very complex content (reading level > 14).`, {
        priority: "Medium",
        recommendation: "Simplify language for broader audience accessibility (aim for grade 8-10).",
      }),
    );
    deductions.push(Math.min(10, complexPages * 2));
  }

  issues.push(
    issue("Color contrast is not measured by this tool.", {
      priority: "Low",
      recommendation: "Use browser DevTools or axe to check contrast and accessibility.",
    }),
  );

  let score = scoreFromDeductions(100, deductions);
  if (successPages.length > 0 && score === 0) score = 5;
  score = Math.min(100, Math.max(0, score));

  return {
    id: "html_accessibility",
    name: "HTML & Accessibility",
    score,
    issues: sortIssues(issues),
    recommendations: recommendationsOf(issues),
  };
}

function categoryLinkHealth(pages, edges, issuesBroken, issuesRedirects) {
  const issues = [];
  const deductions = [];

  for (const b of issuesBroken.slice(0, 30)) {
    const priority = String(b.status).startsWith("5") ? "Critical" : "High";
    issues.push(
      issue(`Broken URL: ${b.status}`, {
        url: b.url,
        priority,
        recommendation: "Fix or remove the link; return 200 or redirect to a valid URL.",
      }),
    );
  }
  if (issuesBroken.length) deductions.push(Math.min(30, issuesBroken.length * 2));

  for (const r of issuesRedirects.slice(0, 20)) {
    issues.push(
      issue(`Redirect: ${r.status} to ${r.finalUrl}`, {
        url: r.url,
        priority: "Medium",
        recommendation: "Prefer direct URLs or shorten redirect chains.",
      }),
    );
  }
  if (issuesRedirects.length) deductions.push(Math.min(15, issuesRedirects.length));

  const longChains = pages.filter((p) => (p.redirectChainLength || 0) >= REDIRECT_CHAIN_LONG).length;
  if (longChains > 0) {
    issues.push(
      issue(`${longChains} URL(s) have redirect chains (2+ hops).`, {
        priority: "Medium",
        recommendation: "Consolidate redirects to a single hop where possible.",
      }),
    );
    deductions.push(Math.min(10, longChains));
  }

  if (edges.length) {
    const inDegree = new Map();
    const nodes = new Set();
    for (const [from, to] of edges) {
      nodes.add(from);
      nodes.add(to);
      inDegree.set(to, (inDegree.get(to) || 0) + 1);
    }
    const orphans = [...nodes].filter((n) => !inDegree.get(n));
    if (orphans.length > nodes.size * 0.3) {
      issues.push(
        issue(`Many pages have no internal links pointing to them (${orphans.length}).`, {
          priority: "Low",
          recommendation: "Add internal links to important pages to improve crawlability and PageRank.",
        }),
      );
      deductions.push(5);
    }
  }

  return {
    id: "link_health",
    name: "Link Health",
    score: scoreFromDeductions(100, deductions),
    issues: sortIssues(issues),
    recommendations: recommendationsOf(issues),
  };
}

function categoryMobile(pages) {
  const successPages = pages.filter(isSuccess);
  if (successPages.length === 0) {
    return { id: "mobile", name: "Mobile Optimization", score: 0, issues: [], recommendations: [] };
  }

  const issues = [];
  const deductions = [];

  const noViewport = successPages.filter((p) => !p.seo?.viewportPresent).length;
  if (noViewport > 0) {
    issues.push(
      issue(`${noViewport} page(s) missing viewport meta tag.`, {
        priority: "Critical",
        recommendation: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>.",
      }),
    );
    deductions.push(Math.min(25, noViewport * 5));
  }

  const invalid = successPages.filter((p) => {
    if (!p.seo?.viewportPresent) return false;
    return !/width|device-width/i.test(p.seo?.viewportContent || "");
  }).length;
  if (invalid > 0) {
    issues.push(
      issue("Some pages have viewport without width or device-width.", {
        priority: "High",
        recommendation: "Use content='width=device-width, initial-scale=1' (or similar).",
      }),
    );
    deductions.push(10);
  }

  return {
    id: "mobile",
    name: "Mobile Optimization",
    score: scoreFromDeductions(100, deductions),
    issues: sortIssues(issues),
    recommendations: recommendationsOf(issues),
  };
}

function categorySecurity(pages, startUrl, securityFindings) {
  const issues = [];
  const deductions = [];
  const scheme = (new URL(startUrl).protocol || "").replace(":", "").toLowerCase();

  if (scheme && scheme !== "https") {
    issues.push(
      issue("Site is not using HTTPS.", {
        url: startUrl,
        priority: "Critical",
        recommendation: "Serve the site over HTTPS and redirect HTTP to HTTPS.",
      }),
    );
    deductions.push(30);
  }

  const httpFinals = pages.filter((p) => (p.finalUrl || "").toLowerCase().startsWith("http://")).length;
  if (httpFinals > 0) {
    issues.push(
      issue(`${httpFinals} URL(s) resolve to HTTP.`, {
        priority: "Critical",
        recommendation: "Ensure all pages redirect to HTTPS.",
      }),
    );
    deductions.push(20);
  }

  const successPages = pages.filter(isSuccess);
  if (successPages.length > 0) {
    const missingHsts = successPages.filter((p) => !(p.headers?.strictTransportSecurity || "").trim()).length;
    const missingXcto = successPages.filter((p) => !(p.headers?.xContentTypeOptions || "").trim()).length;
    const missingXfo = successPages.filter((p) => !(p.headers?.xFrameOptions || "").trim()).length;

    if (missingHsts >= successPages.length * 0.5) {
      issues.push(
        issue("Strict-Transport-Security header not set.", {
          priority: "High",
          recommendation: "Add Strict-Transport-Security to enforce HTTPS.",
        }),
      );
      deductions.push(15);
    }
    if (missingXcto >= successPages.length * 0.5) {
      issues.push(
        issue("X-Content-Type-Options header not set.", {
          priority: "Medium",
          recommendation: "Add X-Content-Type-Options: nosniff.",
        }),
      );
      deductions.push(5);
    }
    if (missingXfo >= successPages.length * 0.5) {
      issues.push(
        issue("X-Frame-Options header not set.", {
          priority: "Medium",
          recommendation: "Add X-Frame-Options: DENY or SAMEORIGIN.",
        }),
      );
      deductions.push(5);
    }

    const mixed = successPages.reduce((sum, p) => sum + (p.seo?.mixedContentCount || 0), 0);
    if (mixed > 0 && scheme === "https") {
      issues.push(
        issue(`Mixed content: ${mixed} HTTP resource(s) on HTTPS pages.`, {
          priority: "High",
          recommendation: "Load all resources over HTTPS to avoid mixed content.",
        }),
      );
      deductions.push(15);
    }
  }

  const severityDeduction = { Critical: 15, High: 10, Medium: 5, Low: 2 };
  for (const f of securityFindings || []) {
    issues.push(
      issue(f.message || "", {
        url: f.url || "",
        priority: f.severity || "Medium",
        recommendation: f.recommendation || "",
      }),
    );
    deductions.push(Math.min(severityDeduction[f.severity] ?? 2, 15));
  }

  return {
    id: "security",
    name: "Security",
    score: scoreFromDeductions(100, deductions),
    issues: sortIssues(issues),
    recommendations: recommendationsOf(issues),
  };
}

function categoryIntelligence(mlBundle) {
  const issues = [];
  const deductions = [];
  const bundle = mlBundle || {};

  const dups = bundle.contentDuplicates || [];
  if (dups.length) {
    const big = dups.filter((g) => (g.memberCount || (g.memberUrls || []).length) >= 3);
    if (big.length) {
      issues.push(
        issue(`Near-duplicate content: ${big.length} cluster(s) with 3+ URLs (SimHash/fuzzy).`, {
          priority: "High",
          recommendation: "Consolidate or canonicalize duplicate pages; differentiate thin similar URLs.",
        }),
      );
      deductions.push(Math.min(20, 5 + big.length));
    } else {
      issues.push(
        issue(`Possible duplicate content: ${dups.length} pair/group(s) detected.`, {
          priority: "Medium",
          recommendation: "Review clusters and add canonicals or noindex where appropriate.",
        }),
      );
      deductions.push(8);
    }
  }

  const anomalies = bundle.anomalies || [];
  if (anomalies.length >= 5) {
    issues.push(
      issue(`Unusual pages (multivariate outlier): ${anomalies.length} URL(s) flagged.`, {
        priority: "Medium",
        recommendation: "Review anomalies for crawl noise, soft-404s, or template bugs.",
      }),
    );
    deductions.push(Math.min(15, 5 + Math.floor(anomalies.length / 10)));
  } else if (anomalies.length) {
    issues.push(
      issue(`${anomalies.length} URL(s) look statistically unusual vs the rest of the crawl.`, {
        priority: "Low",
        recommendation: "Spot-check flagged URLs in the Links inspector.",
      }),
    );
    deductions.push(3);
  }

  const lang = bundle.languageSummary || {};
  if (lang.mixedSite && (lang.detectedPages || 0) >= 10) {
    const top = Object.entries(lang.counts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const desc = top.length ? top.map(([k, v]) => `${k}:${v}`).join(", ") : "multiple";
    issues.push(
      issue(`Mixed languages detected across pages (${desc}).`, {
        priority: "Medium",
        recommendation: "Ensure hreflang and localized URLs match user intent; split sitemaps if needed.",
      }),
    );
    deductions.push(5);
  }

  return {
    id: "intelligence",
    name: "Content intelligence",
    score: scoreFromDeductions(100, deductions),
    issues: sortIssues(issues),
    recommendations: recommendationsOf(issues),
  };
}

/**
 * Build all 8 categories from crawled pages. `edges`, `securityFindings`,
 * `lighthouseSummary`, and `mlBundle` are optional inputs from later phases
 * (Phase 3/4/6) — categories degrade gracefully to fewer issues/null scores
 * until those phases populate them, per docs/ROADMAP.md. `externalBrokenLinks`
 * (Phase 2) are broken links found by checking outlinks that weren't
 * themselves crawled (external links, or links beyond depth/page limits).
 */
export function buildCategories(
  pages,
  {
    edges = [],
    siteLevel,
    startUrl,
    securityFindings = null,
    lighthouseSummary = null,
    mlBundle = null,
    externalBrokenLinks = [],
  },
) {
  const issuesBroken = [
    ...pages
      .filter((p) => (typeof p.status === "number" && p.status >= 400) || p.status === "error")
      .map((p) => ({ url: p.url, status: String(p.status) })),
    ...externalBrokenLinks.map((l) => ({ url: l.url, status: String(l.status) })),
  ];

  const issuesRedirects = pages
    .filter((p) => (p.redirectChainLength || 0) > 0)
    .map((p) => ({ url: p.url, status: String(p.status), finalUrl: p.finalUrl }));

  const cwv = lighthouseSummary
    ? categoryCoreWebVitalsFromLighthouse(lighthouseSummary)
    : categoryCoreWebVitals();

  return [
    categoryTechnicalSeo(pages, siteLevel),
    cwv,
    categoryPerformance(pages),
    categoryHtmlAccessibility(pages),
    categoryLinkHealth(pages, edges, issuesBroken, issuesRedirects),
    categoryMobile(pages),
    categorySecurity(pages, startUrl, securityFindings),
    categoryIntelligence(mlBundle),
  ];
}
