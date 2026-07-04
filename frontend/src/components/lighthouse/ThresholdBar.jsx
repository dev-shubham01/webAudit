import { useState, useEffect, useRef } from "react";
import { METRIC_THRESHOLDS, metricStatus, formatMetric } from "../../utils/lighthouseUtils.js";

export default function ThresholdBar({ metricKey, value }) {
  const t = METRIC_THRESHOLDS[metricKey];
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  if (!t || value == null) {
    return (
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm text-foreground">{t?.label || metricKey}</span>
        <span className="text-sm font-semibold text-muted-foreground">—</span>
      </div>
    );
  }

  const v = Number(value);
  const status = metricStatus(metricKey, v);
  const barColor = status === "good" ? "bg-green-500" : status === "warn" ? "bg-yellow-500" : "bg-red-500";
  const textColor = status === "good" ? "text-green-400" : status === "warn" ? "text-yellow-400" : "text-red-400";
  const refVal = t.good * 1.5;
  const pct = Math.min(100, (v / refVal) * 100);

  return (
    <div
      className="relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={barRef}
    >
      <span className="w-44 shrink-0 text-sm text-foreground">{t.label}</span>
      <div className="flex flex-1 items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: mounted ? `${pct}%` : "0%" }}
          />
        </div>
        <span className={`w-16 shrink-0 text-right text-sm font-semibold tabular-nums ${textColor}`}>
          {formatMetric(metricKey, v)}
        </span>
      </div>

      {hovered && (
        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 ml-4 w-72 rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="mb-1 text-sm font-semibold text-foreground">{t.label}</div>
          <p className="mb-2 text-xs text-muted-foreground">{t.desc}</p>
          <div className="flex gap-4 text-xs">
            <span>
              <span className="text-muted-foreground">Value:</span> <span className={textColor}>{formatMetric(metricKey, v)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Good:</span>{" "}
              <span className="text-green-400">≤{formatMetric(metricKey, t.good)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Warn:</span>{" "}
              <span className="text-yellow-400">≤{formatMetric(metricKey, t.warn)}</span>
            </span>
          </div>
          <div className={`mt-2 text-xs font-semibold ${textColor}`}>
            {status === "good" ? "✓ Good" : status === "warn" ? "⚠ Needs improvement" : "✕ Poor"}
          </div>
        </div>
      )}
    </div>
  );
}
