function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function normalizeScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return clamp(num, 0, 100);
}

function getLabel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

function createInsight(type, issue, severity, fix) {
  return { type, issue, severity, fix };
}

function calculateSeoScore(seo) {
  if (!seo || typeof seo !== "object") return 0;

  let score = 100;

  if (!seo.hasTitle) score -= 25;
  if (!seo.hasMetaDescription) score -= 15;

  const h1Count = Number(seo.h1Count);
  if (!Number.isFinite(h1Count) || h1Count === 0) {
    score -= 15;
  } else if (h1Count > 1) {
    score -= 5;
  }

  const totalImages = Number(seo.totalImages);
  const missingAlt = Number(seo.missingAlt);

  if (Number.isFinite(totalImages) && totalImages > 0) {
    const safeMissingAlt = Number.isFinite(missingAlt) ? Math.max(0, missingAlt) : 0;
    const penalty = Math.min(20, (safeMissingAlt / totalImages) * 20);
    score -= penalty;
  }

  return normalizeScore(score);
}

function calculatePerformanceScore(performance) {
  const candidate =
    performance && typeof performance === "object"
      ? performance.performanceScore
      : performance;
  return normalizeScore(candidate);
}

function calculateErrorScore(consoleErrors = [], networkErrors = []) {
  const safeConsoleErrors = Array.isArray(consoleErrors) ? consoleErrors : [];
  const safeNetworkErrors = Array.isArray(networkErrors) ? networkErrors : [];

  const consolePenalty = Math.min(30, safeConsoleErrors.length * 4);
  const networkPenalty = Math.min(30, safeNetworkErrors.length * 5);
  const score = 100 - (consolePenalty + networkPenalty);

  return normalizeScore(score);
}

function getSeoInsights(seo) {
  const insights = [];

  if (!seo || typeof seo !== "object") {
    insights.push(
      createInsight(
        "SEO",
        "SEO data is missing",
        "high",
        "Run SEO analysis and provide title, meta, heading, and image-alt metrics"
      )
    );
    return insights;
  }

  if (!seo.hasTitle) {
    insights.push(
      createInsight(
        "SEO",
        "Missing title tag",
        "high",
        "Add a unique, descriptive title tag around 50-60 characters"
      )
    );
  }

  if (!seo.hasMetaDescription) {
    insights.push(
      createInsight(
        "SEO",
        "Missing meta description",
        "high",
        "Add meta description under 160 characters"
      )
    );
  }

  const h1Count = Number(seo.h1Count);
  if (!Number.isFinite(h1Count) || h1Count === 0) {
    insights.push(
      createInsight(
        "SEO",
        "No H1 heading found",
        "medium",
        "Add exactly one clear H1 heading that reflects page intent"
      )
    );
  } else if (h1Count > 1) {
    insights.push(
      createInsight(
        "SEO",
        "Multiple H1 headings detected",
        "low",
        "Keep a single primary H1 and use H2/H3 for sub-sections"
      )
    );
  }

  const totalImages = Number(seo.totalImages);
  const missingAlt = Number(seo.missingAlt);
  if (Number.isFinite(totalImages) && totalImages > 0) {
    const safeMissingAlt = Number.isFinite(missingAlt) ? Math.max(0, missingAlt) : 0;
    const ratio = safeMissingAlt / totalImages;
    if (ratio > 0) {
      let severity = "low";
      if (ratio >= 0.5) severity = "high";
      else if (ratio >= 0.2) severity = "medium";

      insights.push(
        createInsight(
          "SEO",
          `${safeMissingAlt} image(s) missing alt text`,
          severity,
          "Add meaningful alt text to informative images and empty alt text for decorative ones"
        )
      );
    }
  }

  return insights;
}

function getPerformanceInsights(performanceScore, rawPerformance) {
  const insights = [];
  const hasPerformanceInput =
    rawPerformance !== undefined && rawPerformance !== null;

  if (!hasPerformanceInput) {
    insights.push(
      createInsight(
        "Performance",
        "Performance data is missing",
        "high",
        "Run Lighthouse and provide a valid performance score between 0 and 100"
      )
    );
    return insights;
  }

  if (performanceScore < 50) {
    insights.push(
      createInsight(
        "Performance",
        "Very low performance score",
        "high",
        "Improve Core Web Vitals, reduce JS payload, optimize images, and enable caching"
      )
    );
  } else if (performanceScore < 75) {
    insights.push(
      createInsight(
        "Performance",
        "Performance needs improvement",
        "medium",
        "Optimize render-blocking resources and reduce unused JavaScript/CSS"
      )
    );
  } else if (performanceScore < 90) {
    insights.push(
      createInsight(
        "Performance",
        "Performance is good but can be improved",
        "low",
        "Tune image formats, preconnect critical origins, and improve TTFB"
      )
    );
  }

  return insights;
}

function getErrorInsights(consoleErrors = [], networkErrors = []) {
  const insights = [];
  const safeConsoleErrors = Array.isArray(consoleErrors) ? consoleErrors : [];
  const safeNetworkErrors = Array.isArray(networkErrors) ? networkErrors : [];

  if (safeConsoleErrors.length > 0) {
    const severity = safeConsoleErrors.length >= 5 ? "high" : "medium";
    insights.push(
      createInsight(
        "Errors",
        `${safeConsoleErrors.length} console error(s) detected`,
        severity,
        "Fix JavaScript runtime errors and failed resource parsing in browser console"
      )
    );
  }

  if (safeNetworkErrors.length > 0) {
    const severity = safeNetworkErrors.length >= 3 ? "high" : "medium";
    insights.push(
      createInsight(
        "Errors",
        `${safeNetworkErrors.length} network request(s) failed`,
        severity,
        "Resolve failed API/static asset requests and verify endpoints return healthy responses"
      )
    );
  }

  return insights;
}

export function calculateScore({
  seo,
  performance,
  consoleErrors = [],
  networkErrors = [],
} = {}) {
  try {
    const seoScore = calculateSeoScore(seo);
    const performanceScore = calculatePerformanceScore(performance);
    const errorScore = calculateErrorScore(consoleErrors, networkErrors);
    const insights = [
      ...getSeoInsights(seo),
      ...getPerformanceInsights(performanceScore, performance),
      ...getErrorInsights(consoleErrors, networkErrors),
    ];

    const weightedOverall =
      seoScore * 0.4 + performanceScore * 0.4 + errorScore * 0.2;
    const overallScore = normalizeScore(Math.round(weightedOverall));
    const label = getLabel(overallScore);

    return {
      overallScore,
      label,
      breakdown: {
        seo: seoScore,
        performance: performanceScore,
        errors: errorScore,
      },
      insights,
    };
  } catch (_error) {
    return {
      overallScore: 0,
      label: "Poor",
      breakdown: {
        seo: 0,
        performance: 0,
        errors: 0,
      },
      insights: [
        createInsight(
          "System",
          "Scoring failed unexpectedly",
          "high",
          "Retry the audit and ensure input data follows expected format"
        ),
      ],
    };
  }
}

export { clamp };
