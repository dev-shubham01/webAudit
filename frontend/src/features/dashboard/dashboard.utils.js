export function scoreBand(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "bad";
  if (n >= 90) return "good";
  if (n >= 70) return "warn";
  return "bad";
}

export const bandStyles = {
  good: {
    text: "text-[#22C55E]",
    bg: "bg-[#22C55E]/10",
    border: "border-[#22C55E]/40",
    ring: "ring-[#22C55E]/20",
    bar: "bg-[#22C55E]",
  },
  warn: {
    text: "text-[#EAB308]",
    bg: "bg-[#EAB308]/10",
    border: "border-[#EAB308]/40",
    ring: "ring-[#EAB308]/20",
    bar: "bg-[#EAB308]",
  },
  bad: {
    text: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10",
    border: "border-[#EF4444]/40",
    ring: "ring-[#EF4444]/20",
    bar: "bg-[#EF4444]",
  },
};

export const cardShell =
  "rounded-xl border border-[#334155] bg-[#1E293B] shadow-lg shadow-black/25 transition-all duration-200 hover:border-indigo-500 hover:shadow-md";

export const sectionTitleClass = "text-xl font-semibold tracking-tight text-[#E2E8F0]";
export const sectionDescClass = "text-sm text-[#94A3B8]";

export function heroMessage(overall) {
  if (!Number.isFinite(overall)) {
    return "Run a scan to see how your site is doing.";
  }
  if (overall >= 90) return "Your website is performing very well.";
  if (overall >= 70) {
    return "Solid foundation — a few improvements could lift your score further.";
  }
  if (overall >= 50) {
    return "Several areas need attention to improve overall health.";
  }
  return "Important issues detected — prioritize fixes below.";
}

export function kpiHint(kind, value) {
  const band = scoreBand(value);
  if (kind === "performance") {
    if (band === "good") return "Load and runtime are in great shape.";
    if (band === "warn") return "Room to optimize speed and Core Web Vitals.";
    return "Performance likely hurting UX — focus on LCP and blocking assets.";
  }
  if (kind === "seo") {
    if (band === "good") return "Strong on-page SEO signals.";
    if (band === "warn") return "Fix titles, meta, or headings to improve SEO.";
    return "Critical SEO gaps — see insights for next steps.";
  }
  if (band === "good") return "Few console or network issues detected.";
  if (band === "warn") return "Some errors detected — review the list below.";
  return "Many errors — stability and trust are at risk.";
}

export function formatMs(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

export function vitalRating(name, value) {
  if (value == null || !Number.isFinite(value)) {
    return { label: "No data", band: "muted" };
  }
  if (name === "cls") {
    if (value <= 0.1) return { label: "Good", band: "good" };
    if (value <= 0.25) return { label: "Needs improvement", band: "warn" };
    return { label: "Poor", band: "bad" };
  }
  if (name === "fcp") {
    if (value <= 1800) return { label: "Good", band: "good" };
    if (value <= 3000) return { label: "Needs improvement", band: "warn" };
    return { label: "Poor", band: "bad" };
  }
  if (name === "lcp") {
    if (value <= 2500) return { label: "Good", band: "good" };
    if (value <= 4000) return { label: "Needs improvement", band: "warn" };
    return { label: "Poor", band: "bad" };
  }
  return { label: "—", band: "muted" };
}

export function insightSeverityStyle(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "high") {
    return {
      border: "border-l-[#EF4444]",
      badge: "bg-[#EF4444]/15 text-[#FCA5A5] border border-[#EF4444]/30",
      dot: "bg-[#EF4444]",
    };
  }
  if (s === "medium") {
    return {
      border: "border-l-[#EAB308]",
      badge: "bg-[#EAB308]/15 text-[#FDE047] border border-[#EAB308]/30",
      dot: "bg-[#EAB308]",
    };
  }
  return {
    border: "border-l-[#3B82F6]",
    badge: "bg-[#3B82F6]/15 text-[#93C5FD] border border-[#3B82F6]/30",
    dot: "bg-[#3B82F6]",
  };
}

export function severityEmoji(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "high") return "❌";
  if (s === "medium") return "⚠️";
  return "✅";
}

export function truncate(str, max) {
  if (typeof str !== "string") return null;
  const t = str.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
