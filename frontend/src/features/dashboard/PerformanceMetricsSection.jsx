import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  cardShell,
  formatMs,
  sectionDescClass,
  sectionTitleClass,
  vitalRating,
} from "./dashboard.utils";

export default function PerformanceMetricsSection({ fcp, lcp, cls }) {
  const fcpR = vitalRating("fcp", fcp);
  const lcpR = vitalRating("lcp", lcp);
  const clsR = vitalRating("cls", cls);

  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={`flex items-center gap-2 ${sectionTitleClass}`}>
          <Gauge className="h-5 w-5 shrink-0 text-[#6366F1]" />
          Performance metrics
        </CardTitle>
        <p className={sectionDescClass}>Core Web Vitals thresholds (lab)</p>
      </CardHeader>
      <CardContent className="space-y-0 pt-2">
        {[
          { name: "FCP", sub: "First Contentful Paint", value: fcp, rating: fcpR },
          { name: "LCP", sub: "Largest Contentful Paint", value: lcp, rating: lcpR },
          {
            name: "CLS",
            sub: "Cumulative Layout Shift",
            value: cls,
            rating: clsR,
            isCls: true,
          },
        ].map((row, idx) => (
          <div
            key={row.name}
            className={`flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between ${
              idx < 2 ? "border-b border-[#334155]" : ""
            }`}
          >
            <div>
              <div className="font-medium text-[#E2E8F0]">{row.name}</div>
              <div className="text-xs text-[#64748B]">{row.sub}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <span className="tabular-nums text-lg text-[#F8FAFC]">
                {row.isCls
                  ? cls != null && Number.isFinite(cls)
                    ? cls.toFixed(3)
                    : "—"
                  : formatMs(row.value)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  row.rating.band === "good"
                    ? "bg-[#22C55E]/15 text-[#86EFAC]"
                    : row.rating.band === "warn"
                      ? "bg-[#EAB308]/15 text-[#FDE047]"
                      : row.rating.band === "bad"
                        ? "bg-[#EF4444]/15 text-[#FCA5A5]"
                        : "bg-[#334155] text-[#94A3B8]"
                }`}
              >
                <span className="mr-1" aria-hidden>
                  {row.rating.band === "good"
                    ? "✅"
                    : row.rating.band === "warn"
                      ? "⚠️"
                      : row.rating.band === "bad"
                        ? "❌"
                        : ""}
                </span>
                {row.rating.label}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
