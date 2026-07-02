import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { palette, scoreBandColor } from "../../utils/chartPalette.js";

const tickStyle = { fill: "#94A3B8", fontSize: 11 };
const tooltipStyle = { background: "#0F172A", border: "1px solid #334155", fontSize: 12 };
const gridColor = "rgba(100,116,139,0.3)";

function ChartShell({ title, subtitle, children }) {
  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#E2E8F0]">{title}</CardTitle>
        {subtitle && <p className="text-xs text-[#64748B]">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Horizontal bars for categorical breakdowns (status codes, categories, etc). */
export function HorizontalBarChartCard({ title, subtitle, data, yWidth = 110, height }) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height ?? Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={tickStyle} />
          <YAxis type="category" dataKey="name" width={yWidth} tick={tickStyle} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || palette(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/** Vertical bars for ordered distributions (word count buckets, response time buckets, etc). */
export function VerticalBarChartCard({ title, subtitle, data, height = 220 }) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" tick={{ ...tickStyle, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
          <YAxis allowDecimals={false} tick={tickStyle} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || palette(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/** Grouped (or stacked) vertical bars for multi-series comparisons. */
export function GroupedBarChartCard({
  title,
  subtitle,
  data,
  seriesKeys,
  colors,
  stacked = false,
  yDomain,
  height = 220,
}) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" tick={tickStyle} />
          <YAxis allowDecimals={false} tick={tickStyle} domain={yDomain} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
          {seriesKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors?.[i] || palette(i)}
              radius={stacked ? undefined : [4, 4, 0, 0]}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/** Doughnut chart for part-of-whole breakdowns (status codes, H1 distribution, etc). */
export function DoughnutChartCard({ title, subtitle, data, height = 220 }) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || palette(index)} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function scoreStatusLabel(score) {
  if (score === null || score === undefined) return "Not measured";
  if (score >= 90) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Critical";
}

/** SVG circular progress ring for a 0-100 category score (or null = not measured). */
export function CircularScore({ score, size = 88, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score === null || score === undefined ? 0 : score / 100;
  const color = scoreBandColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * pct} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.26}
          fontWeight="700"
          fill="#E2E8F0"
        >
          {score === null || score === undefined ? "—" : score}
        </text>
      </svg>
      <span className="text-xs" style={{ color }}>
        {scoreStatusLabel(score)}
      </span>
    </div>
  );
}

function xyTooltip(labelX, labelY, formatUrl) {
  return ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ ...tooltipStyle, padding: "6px 10px", borderRadius: 6 }}>
        {formatUrl && d.url && <div className="max-w-[220px] truncate text-[#E2E8F0]">{formatUrl(d.url)}</div>}
        <div className="text-[#94A3B8]">
          {labelX}: {d.x?.toLocaleString?.() ?? d.x}
        </div>
        <div className="text-[#94A3B8]">
          {labelY}: {d.y?.toLocaleString?.() ?? d.y}
        </div>
      </div>
    );
  };
}

/** Bubble chart (scatter + size-encoded Z axis) for 3-metric relationships. */
export function BubbleChartCard({ title, subtitle, data, xLabel, yLabel, color = "#4C72B0", height = 280 }) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis type="number" dataKey="x" name={xLabel} tick={tickStyle} label={{ value: xLabel, position: "insideBottom", offset: -8, fill: "#94A3B8", fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name={yLabel} tick={tickStyle} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 11 }} />
          <ZAxis type="number" dataKey="r" range={[16, 400]} />
          <Tooltip content={xyTooltip(xLabel, yLabel, (u) => String(u).replace(/^https?:\/\//, ""))} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill={color} fillOpacity={0.55} stroke={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/** Plain scatter chart for 2-metric relationships (one dot per data point). */
export function ScatterChartCard({ title, subtitle, data, xLabel, yLabel, color = "#DD8452", height = 280 }) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis type="number" dataKey="x" name={xLabel} tick={tickStyle} label={{ value: xLabel, position: "insideBottom", offset: -8, fill: "#94A3B8", fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name={yLabel} tick={tickStyle} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 11 }} />
          <Tooltip content={xyTooltip(xLabel, yLabel, (u) => String(u).replace(/^https?:\/\//, ""))} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill={color} fillOpacity={0.6} stroke={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
