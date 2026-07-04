import {
  Globe,
  CheckCircle,
  AlertTriangle,
  FileCode,
  BookOpen,
  Share,
  Cpu,
  Timer,
  ExternalLink,
  TrendingUp,
  Medal,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  HorizontalBarChartCard,
  VerticalBarChartCard,
  GroupedBarChartCard,
} from "../../components/charts/ChartCards.jsx";
import { scoreBandColor } from "../../utils/chartPalette.js";
import {
  wordCountDistribution,
  responseTimeDistribution,
  crawlDepthDistribution,
  titleMetaHealth,
  socialPreviewCoverage,
  readingLevelDistribution,
  topMimeTypes,
  statusBreakdown,
} from "./overview.utils.js";

const REC_COLORS = [
  { border: "border-l-blue-500", bg: "bg-blue-500/10", text: "text-link" },
  { border: "border-l-amber-500", bg: "bg-amber-500/10", text: "text-amber-400" },
  { border: "border-l-purple-500", bg: "bg-purple-500/10", text: "text-purple-400" },
  { border: "border-l-green-500", bg: "bg-green-500/10", text: "text-green-400" },
  { border: "border-l-rose-500", bg: "bg-rose-500/10", text: "text-rose-400" },
  { border: "border-l-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-400" },
];

function KpiCard({ icon: Icon, iconColor, label, value, valueColor = "text-foreground", hint, className = "" }) {
  return (
    <Card shadow className={`border-border bg-card ${className}`}>
      <CardContent className="p-4">
        <div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground`}>
          <Icon className={`h-4 w-4 ${iconColor || ""}`} /> {label}
        </div>
        <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
        {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function CategoryRing({ score }) {
  const clamped = score != null ? Math.min(100, Math.max(0, score)) : 0;
  const color = scoreBandColor(score);
  const isCritical = score != null && clamped < 50;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#1F2937"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${clamped}, 100`}
          strokeLinecap="round"
        />
        {isCritical && (
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.8"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
        {score != null ? score : "—"}
      </div>
    </div>
  );
}

function scoreLabel(score) {
  const s = score ?? 0;
  if (s >= 80) return { text: "Good", cls: "text-green-400" };
  if (s >= 50) return { text: "Needs Improvement", cls: "text-yellow-400" };
  return { text: "Critical", cls: "text-red-500" };
}

export default function OverviewScreen({ report }) {
  const payload = report.data;
  const {
    summary,
    kpis,
    categories,
    recommendations,
    siteConfig,
    topPages,
    links,
    contentDuplicates,
    anomalies,
    languageSummary,
  } = payload;

  const [anomOpen, setAnomOpen] = useState(false);

  const maxInlinks = Math.max(1, ...topPages.map((p) => p.inlinksCount || 0));
  const maxOutlinks = Math.max(1, ...topPages.map((p) => p.outlinksCount || 0));
  const depthInfo = crawlDepthDistribution(links);
  const avgOutlinks = links.length
    ? Math.round((links.reduce((s, l) => s + (l.outlinksCount || 0), 0) / links.length) * 10) / 10
    : 0;

  const hasContentIntelligence =
    (contentDuplicates || []).length > 0 ||
    (anomalies || []).length > 0 ||
    Object.keys(languageSummary?.counts || {}).length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site health overview for <span className="text-link">{payload.siteName}</span>. Crawl finished in{" "}
          {summary.crawlTimeS}s · {new Date(payload.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Globe} label="Total URLs" value={(kpis.totalUrls || 0).toLocaleString()} hint={`${avgOutlinks} avg outlinks/page`} />
        <KpiCard
          icon={CheckCircle}
          iconColor="text-green-500"
          label="Success Rate"
          value={`${kpis.successRate ?? 0}%`}
          valueColor="text-green-400"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Broken (4xx/5xx)"
          value={kpis.brokenLinks}
          valueColor="text-red-500"
          hint={`${summary.count4xx ?? 0} 4xx · ${summary.count5xx ?? 0} 5xx`}
          className="border-red-900/30 ring-1 ring-red-500/20"
        />
        <KpiCard icon={FileCode} label="Missing H1s" value={kpis.missingH1} valueColor="text-yellow-500" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={BookOpen} label="Median Word Count" value={kpis.medianWordCount} hint="Per page (2xx pages)" />
        <KpiCard
          icon={Share}
          iconColor="text-link"
          label="OG Tag Coverage"
          value={`${kpis.ogCoveragePct ?? 0}%`}
          valueColor="text-link"
          hint="Pages with og:title"
        />
        <KpiCard
          icon={Cpu}
          iconColor="text-purple-400"
          label="Technologies"
          value={kpis.techCount}
          valueColor="text-purple-400"
          hint="Detected across the site"
        />
        <KpiCard
          icon={Timer}
          iconColor="text-amber-400"
          label="Response Time (p50)"
          value={`${kpis.responseTimeP50 ?? 0}ms`}
          valueColor="text-amber-400"
          hint={`p95 ${kpis.responseTimeP95 ?? 0}ms`}
        />
      </div>

      {hasContentIntelligence && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Content Intelligence
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Card shadow className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-400/80">Duplicate Groups</div>
                <div className="text-3xl font-bold text-violet-300">{(contentDuplicates || []).length}</div>
                <div className="mt-2 text-xs text-muted-foreground">Near-duplicate content groups</div>
              </CardContent>
            </Card>
            <Card shadow className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-400/80">Anomalies</div>
                <div className="text-3xl font-bold text-amber-300">{(anomalies || []).length}</div>
                <div className="mt-2 text-xs text-muted-foreground">Statistical outliers</div>
              </CardContent>
            </Card>
            <Card shadow className="col-span-2 border-border bg-card lg:col-span-1">
              <CardContent className="p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Languages Sampled</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(languageSummary?.counts || {})
                    .slice(0, 8)
                    .map(([lang, n]) => (
                      <span key={lang} className="rounded-lg border border-border bg-background px-2 py-1 font-mono text-xs text-foreground">
                        {lang}: {n}
                      </span>
                    ))}
                  {Object.keys(languageSummary?.counts || {}).length === 0 && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                {languageSummary?.mixedSite && <p className="mt-2 text-xs text-yellow-400/80">Mixed-language site detected.</p>}
              </CardContent>
            </Card>
          </div>

          {(anomalies || []).length > 0 && (
            <Card shadow className="mt-4 border-border bg-card">
              <CardContent className="p-4">
                <button
                  type="button"
                  onClick={() => setAnomOpen((o) => !o)}
                  className="mb-2 flex w-full items-center gap-2 text-left text-sm font-bold text-amber-200/90"
                >
                  {anomOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {anomalies.length} anomalous page{anomalies.length === 1 ? "" : "s"} detected
                </button>
                {anomOpen && (
                  <div className="max-h-72 overflow-auto rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                          <th className="px-3 py-2 font-medium">URL</th>
                          <th className="px-3 py-2 font-medium">Deviation</th>
                          <th className="px-3 py-2 font-medium">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anomalies.map((a, idx) => (
                          <tr key={`${a.url}-${idx}`} className="border-b border-border/50">
                            <td className="max-w-[28rem] break-all px-3 py-2 font-mono text-xs">
                              <a href={a.url} target="_blank" rel="noreferrer" className="text-link hover:underline">
                                {a.url}
                              </a>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs tabular-nums">{a.deviation ?? "—"}σ</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {a.wordCount ?? 0} words · {a.responseTimeMs ?? 0}ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Insights at a Glance</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <VerticalBarChartCard title="Word Count Distribution" subtitle="Content depth (word count)" data={wordCountDistribution(links)} />
          <VerticalBarChartCard title="Response Time Distribution" subtitle="Server / fetch latency" data={responseTimeDistribution(links)} />
          <VerticalBarChartCard
            title="Crawl Depth"
            subtitle={`Max depth ${depthInfo.maxDepth}, avg ${depthInfo.avgDepth}`}
            data={depthInfo.data}
          />
          <GroupedBarChartCard
            title="Title & Meta Description Health"
            data={titleMetaHealth(links)}
            seriesKeys={["Title tags", "Meta descriptions"]}
          />
          <HorizontalBarChartCard title="Social Preview Coverage" subtitle="% of pages with tag present" data={socialPreviewCoverage(links)} yWidth={90} />
          <VerticalBarChartCard title="Reading Level" data={readingLevelDistribution(links)} />
          <HorizontalBarChartCard title="Top MIME Types" data={topMimeTypes(links)} yWidth={140} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-foreground">Health by Category</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const label = scoreLabel(category.score);
            return (
              <Card key={category.id} className="flex items-center gap-6 border-border bg-card p-5">
                <CategoryRing score={category.score} />
                <div className="min-w-0 break-words pr-1">
                  <h3 className="text-lg font-bold text-foreground">{category.name}</h3>
                  <p className={`mt-1 text-sm ${label.cls}`}>{label.text}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xl font-bold text-foreground">Status Breakdown</h2>
        <HorizontalBarChartCard data={statusBreakdown(summary)} yWidth={50} />
      </div>

      <div>
        <h2 className="mb-3 text-xl font-bold text-foreground">Site Configuration</h2>
        <Card shadow className="flex flex-wrap gap-6 border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">robots.txt</span>
            <span className="font-semibold text-foreground">{siteConfig.robotsPresent ? "Present" : "Missing"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">sitemap.xml</span>
            <span className="font-semibold text-foreground">
              {siteConfig.sitemapPresent ? "Present" : "Missing"}
              {siteConfig.sitemapPresent ? (siteConfig.sitemapValid ? " (valid XML)" : " (invalid XML)") : ""}
            </span>
          </div>
        </Card>
      </div>

      {recommendations.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
            <Lightbulb className="h-5 w-5 text-amber-400" /> Recommendations
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recommendations.map((rec, i) => {
              const c = REC_COLORS[i % REC_COLORS.length];
              return (
                <div key={rec} className={`flex items-start gap-3 rounded-r-xl border-l-4 ${c.border} ${c.bg} px-4 py-3`}>
                  <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 ${c.text}`} />
                  <span className="text-sm leading-relaxed text-foreground">{rec}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-foreground">
          <TrendingUp className="h-5 w-5 shrink-0 text-link" /> Most Important Pages
        </h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Ranked by inbound internal links (Importance) and outbound internal links (Connections).
        </p>
        <Card shadow className="overflow-hidden border-border bg-card p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="sticky left-0 z-30 w-14 min-w-[3.5rem] border-r border-border bg-card px-3 py-2 text-center font-medium shadow-[4px_0_12px_-4px_rgba(0,0,0,0.45)]">
                    Rank
                  </th>
                  <th className="sticky left-14 z-30 min-w-[200px] max-w-[280px] border-r border-border bg-card px-4 py-2 text-left font-medium shadow-[4px_0_12px_-4px_rgba(0,0,0,0.45)]">
                    Page
                  </th>
                  <th className="px-4 py-2 text-right font-medium">Importance</th>
                  <th className="px-4 py-2 text-right font-medium">Connections</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page, index) => {
                  const prPct = Math.round(((page.inlinksCount || 0) / maxInlinks) * 100);
                  const degPct = Math.round(((page.outlinksCount || 0) / maxOutlinks) * 100);
                  const medalCls =
                    index === 0 ? "text-amber-400" : index === 1 ? "text-foreground" : index === 2 ? "text-orange-400/90" : null;
                  return (
                    <tr key={page.url} className="border-b border-border/50">
                      <td className="sticky left-0 z-20 w-14 min-w-[3.5rem] border-r border-border bg-card text-center align-middle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.35)]">
                        <div className="inline-flex items-center justify-center gap-1 px-3 py-2">
                          {medalCls && <Medal className={`h-4 w-4 shrink-0 ${medalCls}`} />}
                          <span className={`font-semibold tabular-nums ${medalCls || "text-muted-foreground"}`}>{index + 1}</span>
                        </div>
                      </td>
                      <td className="sticky left-14 z-20 min-w-0 max-w-[280px] border-r border-border bg-card align-middle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.35)]">
                        <div className="flex min-w-0 flex-col gap-0.5 px-4 py-2">
                          <div className="line-clamp-2 truncate text-sm font-medium leading-snug text-foreground" title={page.title || page.url}>
                            {page.title || <span className="font-normal italic text-muted-foreground">No title</span>}
                          </div>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-link"
                            title={page.url}
                          >
                            <span className="truncate font-mono">{page.url}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right align-middle">
                        <div className="flex w-full min-w-0 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                          <div className="order-2 hidden h-2 min-w-0 flex-1 rounded-full bg-border sm:order-1 sm:block">
                            <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-400" style={{ width: `${prPct}%` }} />
                          </div>
                          <span className="order-1 shrink-0 text-sm font-semibold tabular-nums text-foreground sm:order-2">{prPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right align-middle">
                        <div className="flex w-full min-w-0 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                          <div className="order-2 hidden h-2 min-w-0 flex-1 rounded-full bg-border sm:order-1 sm:block">
                            <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400" style={{ width: `${degPct}%` }} />
                          </div>
                          <span className="order-1 shrink-0 text-sm font-semibold tabular-nums text-foreground sm:order-2">{page.outlinksCount ?? 0}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
