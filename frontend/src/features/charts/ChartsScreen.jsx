import { useMemo } from "react";
import {
  HorizontalBarChartCard,
  VerticalBarChartCard,
  BubbleChartCard,
  ScatterChartCard,
} from "../../components/charts/ChartCards.jsx";
import { crawlDepthDistribution } from "../overview/overview.utils.js";
import { responseTimeStats, outboundLinkDomains } from "../contentanalytics/contentAnalytics.utils.js";
import {
  statusDistribution,
  mimeDistribution,
  outlinksDistribution,
  titleLengthDistribution,
  bubbleData,
  scatterData,
} from "./charts.utils.js";

export default function ChartsScreen({ report }) {
  const { links, summary, topPages, url: startUrl } = report.data;

  const statusChart = useMemo(() => statusDistribution(summary), [summary]);
  const mimeChart = useMemo(() => mimeDistribution(links), [links]);
  const outlinksChart = useMemo(() => outlinksDistribution(links), [links]);
  const titleLenChart = useMemo(() => titleLengthDistribution(links), [links]);
  const domainRows = useMemo(() => outboundLinkDomains(links, startUrl, 10), [links, startUrl]);
  const domainChart = domainRows.map((d) => ({ name: d.host, count: d.linkCount }));

  const rtStats = useMemo(() => responseTimeStats(links), [links]);
  const rtChart = Object.entries(rtStats.distribution).map(([name, count]) => ({ name, count }));

  const depthInfo = useMemo(() => crawlDepthDistribution(links), [links]);

  const bubblePoints = useMemo(() => bubbleData(topPages || []), [topPages]);
  const scatterPoints = useMemo(() => scatterData(links), [links]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Crawl Analytics</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Status codes, content types, outlinks, title length, and domain distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HorizontalBarChartCard
          title="Status code distribution"
          subtitle={`Crawl response codes${summary.totalUrls ? ` · ${summary.totalUrls.toLocaleString()} URLs` : ""}`}
          data={statusChart}
          yWidth={80}
          height={260}
        />
        <VerticalBarChartCard title="Top content-types" subtitle="By URL count" data={mimeChart} height={260} />
        <VerticalBarChartCard title="Outlinks per page" subtitle="Bucket distribution" data={outlinksChart} height={260} />
        <VerticalBarChartCard
          title="Title length (characters)"
          subtitle="30-60 is ideal for SEO"
          data={titleLenChart}
          height={260}
        />
      </div>

      {domainChart.length > 0 && (
        <HorizontalBarChartCard
          title="Top domains discovered"
          subtitle="By URL count (ranking)"
          data={domainChart}
          yWidth={140}
          height={280}
        />
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#E2E8F0]">Performance & Depth Analytics</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <VerticalBarChartCard
            title="Response Time Distribution"
            subtitle={`p50: ${rtStats.p50}ms · p75: ${rtStats.p75}ms · p95: ${rtStats.p95}ms`}
            data={rtChart}
            height={260}
          />
          <VerticalBarChartCard
            title="Page Depth Distribution"
            subtitle={`Max depth: ${depthInfo.maxDepth} · Avg depth: ${depthInfo.avgDepth}`}
            data={depthInfo.data}
            height={260}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BubbleChartCard
          title="Inlinks vs Word Count"
          subtitle="Bubble size = relative inbound-link weight"
          data={bubblePoints}
          xLabel="Inlinks"
          yLabel="Word Count"
          height={300}
        />
        <ScatterChartCard
          title="Word Count vs Response Time"
          subtitle="Each dot is one page"
          data={scatterPoints}
          xLabel="Word Count"
          yLabel="Response Time (ms)"
          height={300}
        />
      </div>
    </div>
  );
}
