import { useMemo, useState } from "react";
import {
  BookOpen,
  Globe,
  X as TwitterIcon,
  FileText,
  AlertTriangle,
  BarChart2,
  Share2,
  ChevronDown,
  ChevronRight,
  Layers,
  Activity,
  ListChecks,
  Link2,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import {
  HorizontalBarChartCard,
  VerticalBarChartCard,
  GroupedBarChartCard,
  DoughnutChartCard,
} from "../../components/charts/ChartCards.jsx";
import { palette } from "../../utils/chartPalette.js";
import { CONTENT_FILTERS, buildContentUrls } from "../content/content.utils.js";
import { crawlDepthDistribution } from "../overview/overview.utils.js";
import {
  wordCountStats,
  wordCountDistribution,
  readingLevelDistribution,
  contentRatioDistribution,
  topKeywordsSite,
  thinPagesByWordCount,
  seoHealth,
  socialCoverage,
  responseTimeStats,
  hreflangSummary,
  outboundLinkDomains,
} from "./contentAnalytics.utils.js";

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#334155] pb-4">
      <div className="rounded-lg border border-[#334155] bg-[#1E293B] p-2">
        <Icon className="h-5 w-5 text-[#6366F1]" />
      </div>
      <h2 className="text-lg font-bold text-[#E2E8F0]">{title}</h2>
    </div>
  );
}

function CoverageBar({ label, pct, color }) {
  const safeP = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[#94A3B8]">
        <span className="font-medium">{label}</span>
        <span className={`font-bold ${color}`}>{safeP}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#334155]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            safeP >= 80 ? "bg-green-500" : safeP >= 50 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${safeP}%` }}
        />
      </div>
    </div>
  );
}

function ThinPagesSection({ pages }) {
  const [open, setOpen] = useState(false);
  if (!pages.length) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 py-1 text-sm font-semibold text-amber-400 transition-colors hover:text-amber-300"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        View {pages.length} thin page{pages.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-[#334155]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#0F172A]">
              <tr className="text-xs uppercase text-[#64748B]">
                <th className="w-8 px-3 py-2 text-center">#</th>
                <th className="px-3 py-2">URL</th>
                <th className="w-20 px-3 py-2 text-center">Words</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p, i) => (
                <tr key={p.url} className="border-t border-[#334155]/50">
                  <td className="px-3 py-2 text-center font-mono text-xs text-[#64748B]">{i + 1}</td>
                  <td className="max-w-[360px] truncate px-3 py-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      title={p.url}
                      className="block truncate font-mono text-xs text-[#6366F1] hover:underline"
                    >
                      {p.url}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-xs font-bold text-amber-400">{p.wordCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UrlListCard({ icon: Icon, iconColor, title, urls }) {
  if (!urls.length) return null;
  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <div className="flex items-center gap-2 border-b border-[#334155] px-4 py-3">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h3 className="text-sm font-bold text-[#E2E8F0]">{title}</h3>
        <span className="ml-auto rounded-full bg-[#334155]/60 px-2.5 py-0.5 text-xs font-bold text-[#94A3B8]">
          {urls.length}
        </span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#0F172A]">
            <tr className="text-xs uppercase text-[#64748B]">
              <th className="w-8 px-3 py-2 text-center">#</th>
              <th className="px-3 py-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {urls.slice(0, 50).map((u, i) => (
              <tr key={u} className="border-t border-[#334155]/50">
                <td className="px-3 py-2 text-center font-mono text-xs text-[#64748B]">{i + 1}</td>
                <td className="max-w-[360px] truncate px-3 py-2">
                  <a
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    title={u}
                    className="block truncate font-mono text-xs text-[#6366F1] hover:underline"
                  >
                    {u}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function qualityColor(label) {
  const l = label.toLowerCase();
  if (l.includes("missing") || l.includes("no h1")) return "#EF4444";
  if (l.includes("short") || l.includes("long")) return "#EAB308";
  if (l.includes("optimal") || l.includes("one h1")) return "#22C55E";
  return "#4C72B0";
}

export default function ContentAnalyticsScreen({ report }) {
  const { links, summary, languageSummary, url: startUrl } = report.data;

  const wcStats = useMemo(() => wordCountStats(links), [links]);
  const wcDist = useMemo(() => wordCountDistribution(links), [links]);
  const rlDist = useMemo(() => readingLevelDistribution(links), [links]);
  const crDist = useMemo(() => contentRatioDistribution(links), [links]);
  const topKw = useMemo(() => topKeywordsSite(links), [links]);
  const thinPages = useMemo(() => thinPagesByWordCount(links), [links]);
  const seo = useMemo(() => seoHealth(links), [links]);
  const social = useMemo(() => socialCoverage(links), [links]);
  const rtStats = useMemo(() => responseTimeStats(links), [links]);
  const hreflang = useMemo(() => hreflangSummary(links), [links]);
  const outboundDomains = useMemo(() => outboundLinkDomains(links, startUrl), [links, startUrl]);
  const depthInfo = useMemo(() => crawlDepthDistribution(links), [links]);
  const contentUrls = useMemo(() => buildContentUrls(links), [links]);

  const wcChartData = Object.entries(wcDist).map(([name, count]) => ({ name, count }));
  const rlChartData = Object.entries(rlDist).map(([name, count]) => ({ name, count }));
  const crChartData = Object.entries(crDist).map(([name, count]) => ({ name, count }));
  const kwChartData = topKw.map((k) => ({ name: k.word, count: k.count }));

  const languageChartData = useMemo(() => {
    const entries = Object.entries(languageSummary?.counts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    return entries.map(([name, count]) => ({ name, count }));
  }, [languageSummary]);

  const h1ChartData = [
    { name: "No H1", value: seo.h1Zero, color: "#EF4444" },
    { name: "One H1", value: seo.h1One, color: "#22C55E" },
    { name: "Multiple H1s", value: seo.h1Multi, color: "#DD8452" },
  ].filter((d) => d.value > 0);

  const titleQualData = [
    { name: "Missing", count: seo.missingTitle },
    { name: "Too Short (<30)", count: seo.titleShort },
    { name: "Optimal (30-60)", count: seo.titleOk },
    { name: "Too Long (>60)", count: seo.titleLong },
  ].map((d) => ({ ...d, color: qualityColor(d.name) }));

  const metaQualData = [
    { name: "Missing", count: seo.missingMetaDesc },
    { name: "Too Short (<70)", count: seo.metaDescShort },
    { name: "Optimal (70-160)", count: seo.metaDescOk },
    { name: "Too Long (>160)", count: seo.metaDescLong },
  ].map((d) => ({ ...d, color: qualityColor(d.name) }));

  const titleTotal = seo.missingTitle + seo.titleShort + seo.titleOk + seo.titleLong;
  const metaTotal = seo.missingMetaDesc + seo.metaDescShort + seo.metaDescOk + seo.metaDescLong;
  const h1Total = seo.h1Zero + seo.h1One + seo.h1Multi;
  const titleOkPct = titleTotal ? (100 * seo.titleOk) / titleTotal : 0;
  const metaOkPct = metaTotal ? (100 * seo.metaDescOk) / metaTotal : 0;
  const h1OkPct = h1Total ? (100 * seo.h1One) / h1Total : 0;
  const hasSeoOptimalBar = titleTotal > 0 && metaTotal > 0 && h1Total > 0;

  const seoOptimalData = [
    { name: "Title length", "In range / optimal": Math.round(titleOkPct * 10) / 10, "Needs attention": Math.round((100 - titleOkPct) * 10) / 10 },
    { name: "Meta description", "In range / optimal": Math.round(metaOkPct * 10) / 10, "Needs attention": Math.round((100 - metaOkPct) * 10) / 10 },
    { name: "H1 count", "In range / optimal": Math.round(h1OkPct * 10) / 10, "Needs attention": Math.round((100 - h1OkPct) * 10) / 10 },
  ];

  const thinByWords = thinPages.length;
  const thinByChars = seo.thinContent;
  const hasThinCompare = thinByWords > 0 || thinByChars > 0;
  const thinSignalsData = [
    { name: "Under 300 words", count: thinByWords, color: "#F59E0B" },
    { name: "Small HTML body", count: thinByChars, color: "#DC2626" },
  ];

  const titleMetaCompareData = ["Missing", "Too Short", "Optimal", "Too Long"].map((name, i) => ({
    name,
    "Title tags": [seo.missingTitle, seo.titleShort, seo.titleOk, seo.titleLong][i],
    "Meta descriptions": [seo.missingMetaDesc, seo.metaDescShort, seo.metaDescOk, seo.metaDescLong][i],
  }));
  const hasTitleMetaCompare = titleTotal > 0 && metaTotal > 0;

  const seoGapData = [
    { name: "Title length", "In range": seo.titleOk, "Needs attention": titleTotal - seo.titleOk },
    { name: "Meta description", "In range": seo.metaDescOk, "Needs attention": metaTotal - seo.metaDescOk },
    { name: "H1 count", "In range": seo.h1One, "Needs attention": h1Total - seo.h1One },
  ];

  const statusDoughnutData = [
    { name: "2xx OK", value: summary.count2xx, color: palette(0) },
    { name: "3xx Redirect", value: summary.count3xx, color: palette(1) },
    { name: "4xx Client error", value: summary.count4xx, color: palette(2) },
    { name: "5xx Server error", value: summary.count5xx, color: palette(3) },
  ].filter((d) => d.value > 0);

  const rtDistData = Object.entries(rtStats.distribution).map(([name, count]) => ({ name, count }));
  const hasRtDist = rtDistData.some((d) => d.count > 0);

  const issueBarData = CONTENT_FILTERS.map((f) => ({ name: f.label, count: (contentUrls[f.key] || []).length }));
  const hasIssueBar = issueBarData.some((d) => d.count > 0);

  const socialOverviewData = [
    { name: "Open Graph", "Has Tag": social.ogCoveragePct, Missing: Math.round((100 - social.ogCoveragePct) * 10) / 10 },
    { name: "Twitter Card", "Has Tag": social.twitterCoveragePct, Missing: Math.round((100 - social.twitterCoveragePct) * 10) / 10 },
    { name: "OG Image", "Has Tag": social.ogImageCoveragePct, Missing: Math.round((100 - social.ogImageCoveragePct) * 10) / 10 },
  ];
  const hasSocialData = social.ogCoveragePct > 0 || social.twitterCoveragePct > 0 || social.ogImageCoveragePct > 0;

  const ogImageDoughnutData = [
    { name: "Has OG Image", value: social.ogImageCoveragePct, color: "#4C72B0" },
    { name: "Missing OG Image", value: Math.round((100 - social.ogImageCoveragePct) * 10) / 10, color: "#EF444466" },
  ];

  const missingSocialCompareData = [
    { name: "Open Graph", count: social.missingOg.length, color: "#3B82F6" },
    { name: "Twitter Card", count: social.missingTwitter.length, color: "#38BDF8" },
  ];
  const hasSocialMissCompare = social.missingOg.length > 0 || social.missingTwitter.length > 0;

  const wcPercLadderData = [
    { name: "Min", count: wcStats.min, color: "#64748B" },
    { name: "P25", count: wcStats.p25, color: "#EAB308" },
    { name: "Median", count: wcStats.median, color: "#3B82F6" },
    { name: "Mean", count: wcStats.mean, color: "#A855F7" },
    { name: "P75", count: wcStats.p75, color: "#22C55E" },
    { name: "Max", count: wcStats.max, color: "#F97316" },
  ];
  const hasWcPercBar = wcStats.max > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Content Insights</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Word count, readability, content-to-HTML ratio, top keywords, social meta coverage, crawl health, and
          on-page flags.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <BookOpen className="h-4 w-4" /> Mean Words
            </div>
            <div className="text-3xl font-bold text-[#E2E8F0]">{Math.round(wcStats.mean).toLocaleString()}</div>
            <div className="mt-1 text-xs text-[#64748B]">per page</div>
          </CardContent>
        </Card>
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <FileText className="h-4 w-4" /> Median Words
            </div>
            <div className="text-3xl font-bold text-[#E2E8F0]">{Math.round(wcStats.median).toLocaleString()}</div>
            <div className="mt-1 text-xs text-[#64748B]">per page</div>
          </CardContent>
        </Card>
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <Globe className="h-4 w-4 text-[#6366F1]" /> OG Coverage
            </div>
            <div className="text-3xl font-bold text-[#6366F1]">{social.ogCoveragePct}%</div>
            <div className="mt-1 text-xs text-[#64748B]">open graph tags</div>
          </CardContent>
        </Card>
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <TwitterIcon className="h-4 w-4 text-sky-400" /> Twitter Coverage
            </div>
            <div className="text-3xl font-bold text-sky-400">{social.twitterCoveragePct}%</div>
            <div className="mt-1 text-xs text-[#64748B]">twitter card tags</div>
          </CardContent>
        </Card>
        <Card className={`border-[#334155] bg-[#1E293B] ${thinPages.length > 0 ? "ring-1 ring-amber-500/20" : ""}`}>
          <CardContent className="p-4">
            <div
              className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                thinPages.length > 0 ? "text-amber-400" : "text-[#94A3B8]"
              }`}
            >
              <AlertTriangle className="h-4 w-4" /> Thin Pages
            </div>
            <div className={`text-3xl font-bold ${thinPages.length > 0 ? "text-amber-400" : "text-[#94A3B8]"}`}>
              {thinPages.length}
            </div>
            <div className="mt-1 text-xs text-[#64748B]">under 300 words</div>
          </CardContent>
        </Card>
      </div>

      {(hreflang.pages200 > 0 || outboundDomains.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {hreflang.pages200 > 0 && (
            <Card className="border-[#334155] bg-[#1E293B]">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-[#E2E8F0]">Internationalization (crawl)</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-[#334155] bg-[#0F172A] p-3">
                    <div className="text-xs uppercase tracking-wider text-[#94A3B8]">2xx pages</div>
                    <div className="text-xl font-bold text-[#E2E8F0]">{hreflang.pages200}</div>
                  </div>
                  <div className="rounded-lg border border-[#334155] bg-[#0F172A] p-3">
                    <div className="text-xs uppercase tracking-wider text-[#94A3B8]">Missing &lt;html lang&gt;</div>
                    <div className="text-xl font-bold text-amber-400">{hreflang.pagesMissingHtmlLang}</div>
                  </div>
                  <div className="col-span-2 rounded-lg border border-[#334155] bg-[#0F172A] p-3">
                    <div className="text-xs uppercase tracking-wider text-[#94A3B8]">Pages with hreflang alternates</div>
                    <div className="text-xl font-bold text-sky-400">{hreflang.pagesWithHreflangLinks}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {outboundDomains.length > 0 && (
            <Card className={`border-[#334155] bg-[#1E293B] ${hreflang.pages200 ? "" : "lg:col-span-2"}`}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-[#E2E8F0]">Outbound link domains</h3>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-[#334155]">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#0F172A]">
                      <tr className="text-xs uppercase text-[#64748B]">
                        <th className="px-3 py-2">Host</th>
                        <th className="px-3 py-2 text-right">Links</th>
                        <th className="px-3 py-2 text-right">Pages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outboundDomains.map((row) => (
                        <tr key={row.host} className="border-t border-[#334155]/50">
                          <td className="px-3 py-2 font-mono text-xs text-[#E2E8F0]">{row.host}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-[#94A3B8]">{row.linkCount}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-[#94A3B8]">{row.pageCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {languageChartData.length > 0 && (
        <HorizontalBarChartCard
          title="Language mix"
          data={languageChartData}
          yWidth={100}
          height={Math.max(160, languageChartData.length * 36)}
        />
      )}

      {(statusDoughnutData.length > 0 || hasRtDist) && (
        <div className="space-y-6">
          <SectionHeader icon={Activity} title="Crawl health & response times" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {statusDoughnutData.length > 0 && (
              <DoughnutChartCard
                title="URLs by HTTP status"
                subtitle={`Total crawled: ${summary.totalUrls} · ${summary.successRate}% returned 2xx`}
                data={statusDoughnutData}
                height={260}
              />
            )}
            {hasRtDist && (
              <VerticalBarChartCard
                title="Response time distribution"
                subtitle={`Pages per latency band · p50: ${rtStats.p50}ms, p95: ${rtStats.p95}ms`}
                data={rtDistData}
                height={260}
              />
            )}
          </div>
        </div>
      )}

      {(hasIssueBar || hasSeoOptimalBar || hasThinCompare) && (
        <div className="space-y-6">
          <SectionHeader icon={ListChecks} title="On-page quality & thin content" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {hasIssueBar && <HorizontalBarChartCard title="URLs flagged by issue type" data={issueBarData} yWidth={140} height={320} />}
            {hasSeoOptimalBar && (
              <GroupedBarChartCard
                title='Pages in "good" ranges'
                data={seoOptimalData}
                seriesKeys={["In range / optimal", "Needs attention"]}
                colors={["#22C55E", "#EF444466"]}
                stacked
                yDomain={[0, 100]}
                height={220}
              />
            )}
            {hasThinCompare && <VerticalBarChartCard title="Thin content signals" data={thinSignalsData} height={200} />}
          </div>
        </div>
      )}

      {thinPages.length > 0 && (
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">
                {thinPages.length} page{thinPages.length !== 1 ? "s" : ""} have very little content
              </span>
            </div>
            <ThinPagesSection pages={thinPages} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <SectionHeader icon={BarChart2} title="Content Metrics" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <VerticalBarChartCard title="Word Count Distribution" data={wcChartData} height={260} />
          <HorizontalBarChartCard title="Reading Level Distribution" data={rlChartData} yWidth={150} height={260} />
          <VerticalBarChartCard title="Content-to-HTML Ratio" data={crChartData} height={260} />
          {kwChartData.length > 0 ? (
            <HorizontalBarChartCard title="Top 30 Keywords (Site-Wide)" data={kwChartData} yWidth={100} height={448} />
          ) : (
            <Card className="border-[#334155] bg-[#1E293B]">
              <CardContent className="flex h-64 items-center justify-center p-4 text-sm text-[#94A3B8]">No keyword data</CardContent>
            </Card>
          )}
          {hasWcPercBar && (
            <div className="lg:col-span-2">
              <VerticalBarChartCard title="Word count ladder (min → max)" data={wcPercLadderData} height={220} />
            </div>
          )}
        </div>
      </div>

      {(h1ChartData.length > 0 || titleTotal > 0 || metaTotal > 0) && (
        <div className="space-y-6">
          <SectionHeader icon={Layers} title="On-Page SEO Signals" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {h1ChartData.length > 0 ? (
              <DoughnutChartCard title="H1 Tag Distribution" data={h1ChartData} height={220} />
            ) : (
              <Card className="border-[#334155] bg-[#1E293B]">
                <CardContent className="flex h-56 items-center justify-center p-4 text-sm text-[#94A3B8]">No data</CardContent>
              </Card>
            )}
            <VerticalBarChartCard title="Title Tag Length Quality" data={titleQualData} height={220} />
            <VerticalBarChartCard title="Meta Description Quality" data={metaQualData} height={220} />
          </div>
          {(hasTitleMetaCompare || hasSeoOptimalBar) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {hasTitleMetaCompare && (
                <GroupedBarChartCard title="Title vs Meta-description buckets" data={titleMetaCompareData} seriesKeys={["Title tags", "Meta descriptions"]} height={260} />
              )}
              {hasSeoOptimalBar && (
                <GroupedBarChartCard
                  title="SEO optimal vs gap counts"
                  data={seoGapData}
                  seriesKeys={["In range", "Needs attention"]}
                  colors={["#22C55E", "#EF444466"]}
                  stacked
                  height={260}
                />
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        <SectionHeader icon={Share2} title="Social Meta Coverage" />

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="space-y-4 p-4">
            <CoverageBar label="Open Graph Coverage" pct={social.ogCoveragePct} color="text-[#6366F1]" />
            <CoverageBar label="Twitter Card Coverage" pct={social.twitterCoveragePct} color="text-sky-400" />
          </CardContent>
        </Card>

        {hasSocialData && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GroupedBarChartCard
              title="Social Meta Coverage Overview"
              data={socialOverviewData}
              seriesKeys={["Has Tag", "Missing"]}
              colors={["#22C55E", "#EF444466"]}
              stacked
              yDomain={[0, 100]}
              height={260}
            />
            <DoughnutChartCard title="OG Image Coverage" data={ogImageDoughnutData} height={260} />
          </div>
        )}

        {hasSocialMissCompare && <VerticalBarChartCard title="Missing social tags — URL count" data={missingSocialCompareData} height={220} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UrlListCard icon={Globe} iconColor="text-[#6366F1]" title="Missing Open Graph Tags" urls={social.missingOg} />
          <UrlListCard icon={TwitterIcon} iconColor="text-sky-400" title="Missing Twitter Card Tags" urls={social.missingTwitter} />
          {social.missingOg.length === 0 && social.missingTwitter.length === 0 && (
            <Card className="border-[#334155] bg-[#1E293B] lg:col-span-2">
              <CardContent className="flex items-center gap-3 p-6">
                <Share2 className="h-8 w-8 text-green-500" />
                <p className="text-sm text-[#94A3B8]">
                  All pages have social meta tags, or no data available yet. Run a crawl to populate.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {depthInfo.data.length > 0 && (
        <div className="space-y-6">
          <SectionHeader icon={Layers} title="Site Architecture" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VerticalBarChartCard
              title="Crawl Depth Distribution"
              subtitle={`Max depth: ${depthInfo.maxDepth} · avg: ${depthInfo.avgDepth}`}
              data={depthInfo.data}
              height={260}
            />
            {wcStats.median > 0 && (
              <Card className="border-[#334155] bg-[#1E293B]">
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-bold text-[#E2E8F0]">Word Count Percentiles</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Min", value: wcStats.min, color: "text-[#94A3B8]" },
                      { label: "25th Percentile (P25)", value: wcStats.p25, color: "text-amber-400" },
                      { label: "Median (P50)", value: wcStats.median, color: "text-[#6366F1]" },
                      { label: "Mean (Avg)", value: wcStats.mean, color: "text-purple-400" },
                      { label: "75th Percentile (P75)", value: wcStats.p75, color: "text-green-400" },
                      { label: "Max", value: wcStats.max, color: "text-[#E2E8F0]" },
                    ].map(({ label, value, color }) => {
                      const pct = wcStats.max > 0 ? Math.min(100, (value / wcStats.max) * 100) : 0;
                      return (
                        <div key={label} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#94A3B8]">{label}</span>
                            <span className={`font-bold tabular-nums ${color}`}>{Math.round(value).toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#334155]">
                            <div className={`h-full rounded-full ${color.replace("text-", "bg-")}`} style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
