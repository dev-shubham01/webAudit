/**
 * Build a concise health summary from score + insight signals.
 * Returns stable shape for UI consumption.
 */
export function generateHealthSummary({ score, insights }) {
  const normalizedInsights = Array.isArray(insights) ? insights : [];
  const overall = Number(score?.overallScore);
  const hasScore = Number.isFinite(overall);

  const highCount = normalizedInsights.filter(
    (item) => String(item?.severity || "").toLowerCase() === "high"
  ).length;
  const mediumCount = normalizedInsights.filter(
    (item) => String(item?.severity || "").toLowerCase() === "medium"
  ).length;

  let summary = "Run a scan to generate your website health summary.";
  if (hasScore) {
    if (overall >= 90) {
      summary =
        highCount > 0
          ? "Your website is performing strongly, but a few important issues still need attention."
          : "Your website is in excellent health with only minor improvements remaining.";
    } else if (overall >= 70) {
      summary =
        highCount > 0
          ? "Your website has a solid foundation, but high-priority issues are holding it back."
          : "Your website is in good shape, with clear opportunities to improve quality and speed.";
    } else if (overall >= 50) {
      summary =
        "Your website has noticeable quality and performance gaps that should be prioritized.";
    } else {
      summary =
        "Your website has critical health issues that likely impact user experience and reliability.";
    }
  }

  const strengths = [];
  if (hasScore && overall >= 90) strengths.push("Strong overall site health score.");

  const perf = Number(score?.breakdown?.performance);
  if (Number.isFinite(perf) && perf >= 80) {
    strengths.push("Performance metrics are generally in a healthy range.");
  }

  const seo = Number(score?.breakdown?.seo);
  if (Number.isFinite(seo) && seo >= 80) {
    strengths.push("Core on-page SEO signals look strong.");
  }

  const errors = Number(score?.breakdown?.errors);
  if (Number.isFinite(errors) && errors >= 80) {
    strengths.push("Low level of runtime and network instability.");
  }

  if (normalizedInsights.length === 0) {
    strengths.push("No major issues were flagged in this scan.");
  }

  const issues = normalizedInsights.map((item) => {
    const sev = String(item?.severity || "low").toUpperCase();
    const message = String(item?.message || "Issue detected");
    return `[${sev}] ${message}`;
  });

  return {
    summary,
    strengths,
    issues,
  };
}
