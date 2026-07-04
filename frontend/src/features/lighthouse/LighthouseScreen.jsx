import { useMemo, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";
import { scoreBandColor } from "../../utils/chartPalette.js";
import { CATEGORIES, CATEGORY_LABELS, METRIC_THRESHOLDS, IMPACT_GROUPS, QUICK_WINS } from "../../utils/lighthouseUtils.js";
import {
  ScoreRing,
  ThresholdBar,
  DiagnosticGroup,
  QuickWinCard,
  MultiPageTable,
  LhAuditExpandable,
} from "../../components/lighthouse/index.js";

export default function LighthouseScreen({ report }) {
  const data = report.data;
  const detailRef = useRef(null);

  const byUrl = data.lighthouseByUrl || {};
  const urlList = Object.keys(byUrl);
  const hasMulti = urlList.length >= 2;

  const [selectedUrl, setSelectedUrl] = useState(null);
  const displayUrl = selectedUrl && byUrl[selectedUrl] ? selectedUrl : urlList[0] || null;

  const handleSelectUrl = (url) => {
    setSelectedUrl(url);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const summary = (displayUrl && byUrl[displayUrl]) || data.lighthouseSummary || {};
  const diagnostics =
    (displayUrl && byUrl[displayUrl]?.diagnostics?.length ? byUrl[displayUrl].diagnostics : data.lighthouseDiagnostics) ||
    [];
  const humanSummary = data.lighthouseHumanSummary || summary.humanSummary || "";
  const mm = summary.medianMetrics || {};
  const cs = summary.categoryScores || {};
  const topFailures = summary.topFailures || [];
  const strategy = summary.strategy || "mobile";
  const device = summary.device || strategy;
  const mode = summary.mode || "navigation";
  const categories = summary.categories || CATEGORIES.map((c) => c.id);
  const runTimestamp = summary.runTimestamp || "";
  const iterations = summary.iterations ?? 0;

  const failingAuditsDetailed = useMemo(() => {
    const audits = summary.audits;
    if (!Array.isArray(audits)) return [];
    return audits.filter((a) => a?.score != null && a.score < 1);
  }, [summary.audits]);

  const hasData = summary.url || diagnostics.length > 0 || topFailures.length > 0 || failingAuditsDetailed.length > 0;

  const diagnosticsList = useMemo(() => {
    if (diagnostics.length > 0) return diagnostics;
    return topFailures.map((f) => ({
      warning: f.helpText || f.id,
      lighthouseAuditId: f.id,
      primaryImpact: f.impact || "UX",
      severity: "High",
      oneLineFix: "See Lighthouse report for fix.",
      evidence: f.evidence || [],
    }));
  }, [diagnostics, topFailures]);

  const groupedDiagnostics = useMemo(() => {
    const map = {};
    IMPACT_GROUPS.forEach((g) => {
      map[g.id] = [];
    });
    diagnosticsList.forEach((d) => {
      const impact = (d.primaryImpact || "UX").trim();
      const grp = IMPACT_GROUPS.find(
        (g) =>
          g.id === impact ||
          g.label.toLowerCase().includes(impact.toLowerCase()) ||
          impact.toLowerCase().includes(g.id.toLowerCase()),
      );
      const key = grp ? grp.id : "UX";
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [diagnosticsList]);

  const mostCriticalGroup = useMemo(() => {
    let maxId = "UX";
    let maxCount = 0;
    Object.entries(groupedDiagnostics).forEach(([id, items]) => {
      const critCount = items.filter((d) => ["critical", "high"].includes((d.severity || "").toLowerCase())).length;
      if (critCount > maxCount) {
        maxCount = critCount;
        maxId = id;
      }
    });
    return maxId;
  }, [groupedDiagnostics]);

  const quickWinStatus = useMemo(() => {
    const allAuditIds = new Set(diagnosticsList.map((d) => d.lighthouseAuditId).filter(Boolean));
    const status = {};
    QUICK_WINS.forEach((w) => {
      status[w.id] = w.auditIds.length === 0 ? false : !w.auditIds.some((aid) => allAuditIds.has(aid));
    });
    return status;
  }, [diagnosticsList]);

  if (!hasData) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Page Speed</h1>
          <p className="mt-1 text-sm text-muted-foreground">Core Web Vitals and performance audit results.</p>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No Lighthouse data yet. Run a crawl and regenerate the report to see results here.
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryScoreData = CATEGORIES.map(({ id, label }) => ({
    name: label,
    count: cs[id] != null ? Number(cs[id]) : null,
    color: cs[id] != null ? scoreBandColor(Number(cs[id])) : undefined,
  }))
    .filter((c) => c.count != null)
    .sort((a, b) => a.count - b.count);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Page Speed</h1>
        {summary.url && (
          <p className="mb-1 truncate text-sm text-muted-foreground">
            <a href={summary.url} target="_blank" rel="noreferrer" className="break-all text-[#6366F1] hover:underline">
              {summary.url}
            </a>
          </p>
        )}
        <Card className="mt-4 border-border bg-card">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Analysis settings</h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="mb-0.5 block text-xs text-muted-foreground">Mode</span>
                <span className="font-medium capitalize text-foreground">{mode}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-muted-foreground">Device</span>
                <span className="font-medium capitalize text-foreground">{device}</span>
              </div>
              <div className="min-w-0">
                <span className="mb-0.5 block text-xs text-muted-foreground">Categories</span>
                <span className="font-medium text-foreground">
                  {Array.isArray(categories) ? categories.map((c) => CATEGORY_LABELS[c] || c).join(", ") : ""}
                </span>
              </div>
            </div>
            {(runTimestamp || iterations) && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {iterations > 0 && <span>Runs: {iterations} (medians shown)</span>}
                {runTimestamp && <span className="ml-3">Generated: {new Date(runTimestamp).toLocaleString()}</span>}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {hasMulti && (
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Multi-page comparison</h2>
          <p className="mb-3 text-sm text-muted-foreground">Click any row to view its detailed breakdown below. Sort by any column.</p>
          <Card className="border-border bg-card">
            <CardContent className="overflow-hidden p-0">
              <MultiPageTable byUrl={byUrl} selectedUrl={displayUrl} onSelect={handleSelectUrl} />
            </CardContent>
          </Card>
        </div>
      )}

      {hasMulti && (
        <div ref={detailRef}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed view</h2>
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select
              value={displayUrl || ""}
              onChange={(e) => setSelectedUrl(e.target.value)}
              className="max-w-lg flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
            >
              {urlList.map((url) => {
                const sc = byUrl[url]?.categoryScores?.performance;
                const dot = sc != null ? (sc >= 90 ? "🟢" : sc >= 50 ? "🟡" : "🔴") : "⚪";
                return (
                  <option key={url} value={url}>
                    {dot} {url}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</h2>
        <div className="flex flex-wrap items-center justify-start gap-6">
          {CATEGORIES.map(({ id, label }) => (
            <ScoreRing key={id} label={label} score={cs[id] != null ? Number(cs[id]) : null} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-xs text-muted-foreground">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />
            0–49 Poor
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-yellow-500" />
            50–89 Needs improvement
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500" />
            90–100 Good
          </span>
        </div>
      </div>

      {categoryScoreData.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-sm text-muted-foreground">No category scores</CardContent>
        </Card>
      ) : (
        <HorizontalBarChartCard
          title="Category scores"
          subtitle="Ranked worst to best (Score 0–100)"
          data={categoryScoreData}
          yWidth={110}
        />
      )}

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Metrics</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Hover any metric for threshold details. Bars fill relative to the good threshold. Medians from{" "}
          {iterations || 1} run(s).
        </p>
        <Card className="border-border bg-card">
          <CardContent className="overflow-hidden p-0">
            <div className="divide-y divide-border">
              {Object.keys(METRIC_THRESHOLDS).map((key) => (
                <ThresholdBar key={key} metricKey={key} value={mm[key]} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Wins</h2>
        <p className="mb-4 text-sm text-muted-foreground">Click any card to see why it matters, how to fix it, and the estimated impact.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_WINS.map((win) => (
            <QuickWinCard key={win.id} win={win} passed={quickWinStatus[win.id] ?? false} />
          ))}
        </div>
      </div>

      {humanSummary && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Summary</h2>
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{humanSummary}</pre>
          </CardContent>
        </Card>
      )}

      {failingAuditsDetailed.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Audit tables & previews</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Expand any row for full Lighthouse detail rows (thumbnails, resource URLs, DOM nodes).
          </p>
          <ul className="space-y-2">
            {failingAuditsDetailed.map((a) => (
              <LhAuditExpandable key={a.id} audit={a} />
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Diagnostics & Fixes</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Issues grouped by impact area. Click a group to expand. Click any issue for full detail and evidence.
        </p>
        {diagnosticsList.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No failing audits — all checks passed.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {IMPACT_GROUPS.map((group) => {
              const items = groupedDiagnostics[group.id] || [];
              if (items.length === 0) return null;
              return (
                <DiagnosticGroup key={group.id} group={group} items={items} defaultOpen={group.id === mostCriticalGroup} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
