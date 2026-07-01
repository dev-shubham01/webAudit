import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

function scoreColor(score) {
  if (score === null || score === undefined) return "text-[#64748B]";
  if (score >= 90) return "text-[#22C55E]";
  if (score >= 75) return "text-[#6366F1]";
  if (score >= 50) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function priorityVariant(priority) {
  if (priority === "Critical" || priority === "High") return "destructive";
  if (priority === "Medium") return "secondary";
  return "outline";
}

function StatCard({ label, value }) {
  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <CardContent className="p-4">
        <div className="text-2xl font-bold text-[#E2E8F0]">{value}</div>
        <div className="mt-1 text-xs text-[#94A3B8]">{label}</div>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ category }) {
  const topIssue = category.issues[0];
  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#E2E8F0]">{category.name}</CardTitle>
          <span className={`text-xl font-bold ${scoreColor(category.score)}`}>
            {category.score === null ? "—" : category.score}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-[#94A3B8]">
          {category.issues.length} issue{category.issues.length === 1 ? "" : "s"}
        </p>
        {topIssue && (
          <div className="mt-2 flex items-start gap-2">
            <Badge variant={priorityVariant(topIssue.priority)} className="mt-0.5">
              {topIssue.priority}
            </Badge>
            <p className="text-xs text-[#CBD5E1]">{topIssue.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OverviewScreen({ report }) {
  const payload = report.data;
  const { summary, kpis, categories, recommendations, siteConfig, topPages } = payload;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">{payload.siteName}</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          {payload.url} · crawled {summary.totalUrls} page{summary.totalUrls === 1 ? "" : "s"} in{" "}
          {summary.crawlTimeS}s · {new Date(payload.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total URLs" value={kpis.totalUrls} />
        <StatCard label="Success rate" value={`${kpis.successRate}%`} />
        <StatCard label="Broken links" value={kpis.brokenLinks} />
        <StatCard label="Missing H1" value={kpis.missingH1} />
        <StatCard label="Median word count" value={kpis.medianWordCount} />
        <StatCard label="OG tag coverage" value={`${kpis.ogCoveragePct}%`} />
        <StatCard label="Technologies detected" value={kpis.techCount} />
        <StatCard
          label="Response time (p50 / p95)"
          value={`${kpis.responseTimeP50}ms / ${kpis.responseTimeP95}ms`}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#E2E8F0]">Health by category</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#E2E8F0]">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No recommendations — looking good.</p>
            ) : (
              <ul className="list-disc space-y-2 pl-4 text-sm text-[#CBD5E1]">
                {recommendations.map((rec) => (
                  <li key={rec}>{rec}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#E2E8F0]">Site config</CardTitle>
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
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[#E2E8F0]">
            Top pages{" "}
            <span className="font-normal text-[#64748B]">
              (by crawl depth — inbound-link ranking arrives in a later phase)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#334155] text-xs uppercase text-[#64748B]">
                <th className="px-6 py-2 font-medium">URL</th>
                <th className="px-4 py-2 font-medium">Depth</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Words</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((page) => (
                <tr key={page.url} className="border-b border-[#334155]/50">
                  <td className="max-w-md truncate px-6 py-2 text-[#CBD5E1]" title={page.url}>
                    {page.title || page.url}
                  </td>
                  <td className="px-4 py-2 text-[#94A3B8]">{page.depth}</td>
                  <td className="px-4 py-2 text-[#94A3B8]">{page.status}</td>
                  <td className="px-4 py-2 text-[#94A3B8]">{page.wordCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
