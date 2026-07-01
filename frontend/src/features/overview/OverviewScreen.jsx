import { Globe, CheckCircle, AlertTriangle, FileCode, BookOpen, Share, Cpu, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  HorizontalBarChartCard,
  VerticalBarChartCard,
  GroupedBarChartCard,
  CircularScore,
} from "../../components/charts/ChartCards.jsx";
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

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function KpiCard({ icon: Icon, label, value, color = "#E2E8F0" }) {
  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F172A]">
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color }}>
            {value}
          </div>
          <div className="text-xs text-[#94A3B8]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GradientBar({ pct }) {
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#334155]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
        style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export default function OverviewScreen({ report }) {
  const payload = report.data;
  const { summary, kpis, categories, recommendations, siteConfig, topPages, links } = payload;

  const maxInlinks = Math.max(1, ...topPages.map((p) => p.inlinksCount || 0));
  const depthInfo = crawlDepthDistribution(links);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          {payload.siteName} · {payload.url} · crawled {summary.totalUrls} page{summary.totalUrls === 1 ? "" : "s"} in{" "}
          {summary.crawlTimeS}s · {new Date(payload.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Globe} label="Total URLs" value={kpis.totalUrls} />
        <KpiCard icon={CheckCircle} label="Success Rate (2xx)" value={`${kpis.successRate}%`} color="#22C55E" />
        <KpiCard icon={AlertTriangle} label="Broken (4xx/5xx)" value={kpis.brokenLinks} color="#EF4444" />
        <KpiCard icon={FileCode} label="Missing H1s" value={kpis.missingH1} color="#EAB308" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={BookOpen} label="Median Word Count" value={kpis.medianWordCount} />
        <KpiCard icon={Share} label="OG Tag Coverage" value={`${kpis.ogCoveragePct}%`} color="#3B82F6" />
        <KpiCard icon={Cpu} label="Technologies" value={kpis.techCount} color="#8B5CF6" />
        <KpiCard icon={Timer} label="Response Time (p50)" value={`${kpis.responseTimeP50}ms`} color="#F59E0B" />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#E2E8F0]">Insights at a Glance</h2>
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
        <h2 className="mb-3 text-lg font-semibold text-[#E2E8F0]">Health by Category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Card key={category.id} className="border-[#334155] bg-[#1E293B]">
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <CircularScore score={category.score} />
                <p className="text-center text-xs font-medium text-[#E2E8F0]">{category.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <HorizontalBarChartCard title="Status Breakdown" data={statusBreakdown(summary)} yWidth={50} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#E2E8F0]">Site Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">robots.txt</span>
              <Badge variant={siteConfig.robotsPresent ? "outline" : "destructive"}>
                {siteConfig.robotsPresent ? "Present" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">sitemap.xml</span>
              <Badge variant={siteConfig.sitemapPresent ? "outline" : "destructive"}>
                {siteConfig.sitemapPresent ? "Present" : "Missing"}
              </Badge>
            </div>
            {siteConfig.sitemapPresent && (
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">sitemap valid XML</span>
                <Badge variant={siteConfig.sitemapValid ? "outline" : "destructive"}>
                  {siteConfig.sitemapValid ? "Valid" : "Invalid"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#E2E8F0]">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No recommendations — looking good.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {recommendations.map((rec) => (
                  <div key={rec} className="rounded-md border-l-4 border-[#6366F1] bg-[#0F172A] p-3 text-sm text-[#CBD5E1]">
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[#E2E8F0]">Most Important Pages</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#334155] text-xs uppercase text-[#64748B]">
                <th className="px-6 py-2 font-medium">Rank</th>
                <th className="px-4 py-2 font-medium">Page</th>
                <th className="px-4 py-2 font-medium">Importance</th>
                <th className="px-4 py-2 font-medium">Connections</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((page, index) => {
                const pct = Math.round(((page.inlinksCount || 0) / maxInlinks) * 100);
                return (
                  <tr key={page.url} className="border-b border-[#334155]/50">
                    <td className="px-6 py-2 text-[#94A3B8]">{RANK_MEDALS[index] || index + 1}</td>
                    <td className="max-w-md truncate px-4 py-2 text-[#CBD5E1]" title={page.url}>
                      {page.title || page.url}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <GradientBar pct={pct} />
                        <span className="text-xs text-[#94A3B8]">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[#94A3B8]">{page.inlinksCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
