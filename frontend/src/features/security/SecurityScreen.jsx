import { useMemo, useState } from "react";
import { Shield, ExternalLink } from "lucide-react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";
import { SEVERITY_ORDER, SEVERITY_CONFIG, toTitleCase } from "./security.utils.js";

export default function SecurityScreen({ report }) {
  const allFindings = report.data.securityFindings || [];
  const [severityFilter, setSeverityFilter] = useState("All");

  const severityCounts = useMemo(
    () =>
      SEVERITY_ORDER.reduce((acc, s) => {
        acc[s] = allFindings.filter((f) => (f.severity || "Info") === s).length;
        return acc;
      }, {}),
    [allFindings],
  );

  const severityChartData = SEVERITY_ORDER.map((s) => ({
    name: s,
    value: severityCounts[s] || 0,
    color: SEVERITY_CONFIG[s].chartColor,
  })).filter((d) => d.value > 0);

  const typeData = useMemo(() => {
    const m = new Map();
    allFindings.forEach((f) => {
      const t = toTitleCase(f.findingType) || "Unknown";
      m.set(t, (m.get(t) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [allFindings]);

  let findings = allFindings;
  if (severityFilter !== "All") {
    findings = findings.filter((f) => (f.severity || "Info") === severityFilter);
  }
  findings = [...findings].sort((a, b) => {
    const ao = (SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.Info).order;
    const bo = (SEVERITY_CONFIG[b.severity] || SEVERITY_CONFIG.Info).order;
    return ao - bo;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Security & Headers</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          HTTP security headers, injection risk, open redirect, and vulnerability findings. {allFindings.length}{" "}
          finding{allFindings.length !== 1 ? "s" : ""} total.
        </p>
      </div>

      {allFindings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-[#334155] bg-[#1E293B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#E2E8F0]">Findings by severity</CardTitle>
              <p className="text-xs text-[#64748B]">All findings in this report</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={severityChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {severityChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
                  <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #334155", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {typeData.length > 0 && (
            <HorizontalBarChartCard
              title="Findings by type"
              subtitle="Grouped by finding type from the scanner"
              data={typeData}
              yWidth={160}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {SEVERITY_ORDER.map((sev) => {
          const cfg = SEVERITY_CONFIG[sev];
          const Icon = cfg.icon;
          const count = severityCounts[sev] || 0;
          const isActive = severityFilter === sev;
          return (
            <Card
              key={sev}
              onClick={() => setSeverityFilter((prev) => (prev === sev ? "All" : sev))}
              className={`cursor-pointer select-none border-[#334155] bg-[#1E293B] transition-all ${
                isActive ? `${cfg.ring || "ring-1 ring-neutral-500/20"} ${cfg.border}` : "hover:border-[#475569]"
              }`}
            >
              <CardContent className="p-4">
                <div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
                  <Icon className="h-4 w-4" /> {sev}
                </div>
                <div className={`text-3xl font-bold ${count > 0 ? cfg.text : "text-[#94A3B8]"}`}>{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {severityFilter !== "All" && (
        <button
          type="button"
          onClick={() => setSeverityFilter("All")}
          className="rounded-full border border-[#334155] px-3 py-1 text-xs text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
        >
          ← Show all severities
        </button>
      )}

      {findings.length === 0 ? (
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
            <Shield className="h-14 w-14 text-green-600/60" />
            <div className="text-center">
              <p className="text-base font-semibold text-[#E2E8F0]">No security findings detected</p>
              <p className="mt-1 text-sm text-[#94A3B8]">
                {allFindings.length > 0
                  ? "No findings match the current filters or search."
                  : "Run a crawl with security scanning enabled to see results here."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {findings.map((f, i) => {
            const sev = f.severity || "Info";
            const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.Info;
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className={`flex flex-col gap-3 rounded-xl border border-[#334155] border-l-4 ${cfg.rowBorder} bg-[#1E293B] p-5 transition-colors hover:border-[#475569]`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex shrink-0 items-center gap-2">
                    <Icon className={`h-4 w-4 ${cfg.text}`} />
                    <Badge variant="outline">{sev}</Badge>
                  </div>
                  <span className={`select-all rounded border px-2 py-0.5 font-mono text-xs ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {toTitleCase(f.findingType)}
                  </span>
                  {f.url && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center gap-1 break-all font-mono text-xs text-[#6366F1] hover:underline"
                    >
                      <span className="line-clamp-1">{f.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}
                </div>
                <p className="text-sm leading-snug text-[#E2E8F0]">{f.message || "—"}</p>
                {f.recommendation && (
                  <div className={`rounded-lg border px-3 py-2.5 text-sm leading-relaxed text-[#94A3B8] ${cfg.recBg}`}>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#6366F1]">
                      Recommendation
                    </span>
                    {f.recommendation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
