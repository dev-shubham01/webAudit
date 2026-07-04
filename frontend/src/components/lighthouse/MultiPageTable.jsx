import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { scoreColor, metricStatus, formatMetric } from "../../utils/lighthouseUtils.js";

const COLS = [
  { id: "performance", label: "Perf", isScore: true },
  { id: "accessibility", label: "A11y", isScore: true },
  { id: "seo", label: "SEO", isScore: true },
  { id: "best-practices", label: "Best P.", isScore: true },
  { id: "lcpMs", label: "LCP", isScore: false, fmt: (v) => formatMetric("lcpMs", v) },
  { id: "cls", label: "CLS", isScore: false, fmt: (v) => formatMetric("cls", v) },
  { id: "tbtMs", label: "TBT", isScore: false, fmt: (v) => formatMetric("tbtMs", v) },
  { id: "fcpMs", label: "FCP", isScore: false, fmt: (v) => formatMetric("fcpMs", v) },
];

function scoreTip(score) {
  if (score == null) return "No data";
  if (score >= 90) return "Good (90–100)";
  if (score >= 50) return "Needs Work (50–89)";
  return "Poor (0–49)";
}

function scoreRowBg(perf) {
  if (perf == null) return "";
  if (perf >= 90) return "bg-green-500/5 hover:bg-green-500/10";
  if (perf >= 50) return "bg-yellow-500/5 hover:bg-yellow-500/10";
  return "bg-red-500/5 hover:bg-red-500/10";
}

export default function MultiPageTable({ byUrl, selectedUrl, onSelect }) {
  const [sortCol, setSortCol] = useState("performance");
  const [sortDir, setSortDir] = useState("asc");
  const [hoveredCell, setHoveredCell] = useState(null);

  const rows = useMemo(
    () =>
      Object.entries(byUrl).map(([url, d]) => {
        const cs = d.categoryScores || {};
        const mm = d.medianMetrics || {};
        return {
          url,
          performance: cs.performance != null ? Number(cs.performance) : null,
          accessibility: cs.accessibility != null ? Number(cs.accessibility) : null,
          seo: cs.seo != null ? Number(cs.seo) : null,
          "best-practices": cs["best-practices"] != null ? Number(cs["best-practices"]) : null,
          lcpMs: mm.lcpMs != null ? Number(mm.lcpMs) : null,
          cls: mm.cls != null ? Number(mm.cls) : null,
          tbtMs: mm.tbtMs != null ? Number(mm.tbtMs) : null,
          fcpMs: mm.fcpMs != null ? Number(mm.fcpMs) : null,
        };
      }),
    [byUrl],
  );

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const va = a[sortCol] ?? -1;
        const vb = b[sortCol] ?? -1;
        return sortDir === "asc" ? va - vb : vb - va;
      }),
    [rows, sortCol, sortDir],
  );

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">URL</th>
            {COLS.map((c) => (
              <th
                key={c.id}
                className="cursor-pointer select-none px-3 py-3 hover:text-foreground"
                onClick={() => handleSort(c.id)}
              >
                <div className="flex items-center justify-center gap-1">
                  {c.label}
                  {sortCol === c.id ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((row, i) => {
            const isSelected = selectedUrl === row.url;
            return (
              <tr
                key={i}
                onClick={() => onSelect(row.url)}
                className={`cursor-pointer transition-colors ${scoreRowBg(row.performance)} ${
                  isSelected ? "ring-2 ring-inset ring-blue-500" : ""
                }`}
              >
                <td className="max-w-[250px] truncate px-4 py-3 font-mono text-xs text-[#6366F1]" title={row.url}>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row.url}
                  </a>
                </td>
                {COLS.map((c) => {
                  const val = row[c.id];
                  const cellId = `${i}-${c.id}`;
                  const mStatus = !c.isScore ? metricStatus(c.id, val) : null;
                  const metricColor =
                    mStatus === "good" ? "text-green-400" : mStatus === "warn" ? "text-yellow-400" : "text-red-400";
                  return (
                    <td
                      key={c.id}
                      className="relative px-3 py-3 text-center"
                      onMouseEnter={() => setHoveredCell(cellId)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {c.isScore ? (
                        <span className="text-sm font-bold" style={{ color: val != null ? scoreColor(val) : "rgb(71,85,105)" }}>
                          {val != null ? val : "—"}
                        </span>
                      ) : (
                        <span className={`font-mono text-xs ${val != null ? metricColor : "text-muted-foreground"}`}>
                          {val != null ? c.fmt(val) : "—"}
                        </span>
                      )}
                      {hoveredCell === cellId && c.isScore && val != null && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground shadow-lg">
                          {scoreTip(val)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
