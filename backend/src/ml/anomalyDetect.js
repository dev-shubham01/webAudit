function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
}

function stdDev(values, avg) {
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length || 1);
  return Math.sqrt(variance);
}

const Z_THRESHOLD = 2.5;
const MIN_PAGES = 5;

/**
 * z-score outlier flagging on word count / response time. Approximates the
 * reference's sklearn IsolationForest (no faithful Node equivalent exists) —
 * a simpler heuristic, not multivariate ML. See docs/ARCHITECTURE.md §7.
 */
export function detectAnomalies(pages) {
  const successPages = pages.filter((p) => typeof p.status === "number" && p.status >= 200 && p.status < 300);
  if (successPages.length < MIN_PAGES) return [];

  const wordCounts = successPages.map((p) => p.seo?.wordCount || 0);
  const responseTimes = successPages.map((p) => p.responseTimeMs || 0);

  const wcMean = mean(wordCounts);
  const wcStd = stdDev(wordCounts, wcMean) || 1;
  const rtMean = mean(responseTimes);
  const rtStd = stdDev(responseTimes, rtMean) || 1;

  const anomalies = [];
  successPages.forEach((p, i) => {
    const wcZ = (wordCounts[i] - wcMean) / wcStd;
    const rtZ = (responseTimes[i] - rtMean) / rtStd;
    if (Math.abs(wcZ) >= Z_THRESHOLD || Math.abs(rtZ) >= Z_THRESHOLD) {
      anomalies.push({
        url: p.url,
        wordCount: wordCounts[i],
        responseTimeMs: responseTimes[i],
        deviation: Math.round(Math.max(Math.abs(wcZ), Math.abs(rtZ)) * 100) / 100,
      });
    }
  });

  return anomalies;
}
