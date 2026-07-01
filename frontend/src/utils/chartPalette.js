// Ported from the reference project's src/utils/chartPalette.js so charts
// built with recharts here use the same categorical palette and score-band
// coloring as the reference's Chart.js-based charts.

export const PALETTE_CATEGORICAL = [
  "#4C72B0", // blue
  "#DD8452", // orange
  "#55A868", // green
  "#C44E52", // red
  "#8172B3", // purple
  "#937860", // brown
  "#6B8E9F", // teal
  "#A8BF5A", // lime
];

export const SEMANTIC = {
  good: "#22C55E", // green-500 (score >= 90)
  warn: "#EAB308", // yellow-500 (score >= 50, < 90)
  poor: "#EF4444", // red-500 (score < 50)
  neutral: "rgb(71, 85, 105)", // slate-500
};

export function scoreBandColor(score) {
  if (score === null || score === undefined) return SEMANTIC.neutral;
  if (score >= 90) return SEMANTIC.good;
  if (score >= 50) return SEMANTIC.warn;
  return SEMANTIC.poor;
}

export function palette(index) {
  return PALETTE_CATEGORICAL[index % PALETTE_CATEGORICAL.length];
}

export const PRIORITY_CONFIG = {
  Critical: { color: "#EF4444", border: "border-red-500" },
  High: { color: "#F97316", border: "border-orange-500" },
  Medium: { color: "#EAB308", border: "border-yellow-500" },
  Low: { color: "#64748B", border: "border-neutral-500" },
};
