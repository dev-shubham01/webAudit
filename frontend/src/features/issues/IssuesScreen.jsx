import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Flame, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { ResponsiveContainer, Cell, PieChart, Pie, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const MAX_CATEGORY_CHART = 12;

const PRIORITY_CONFIG = {
  Critical: { border: "border-l-red-500", bg: "bg-red-500/10", text: "text-red-400", ring: "ring-1 ring-red-500/20 border-red-900/30", icon: Flame, color: "#EF4444" },
  High: { border: "border-l-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", ring: "ring-1 ring-orange-500/20 border-orange-900/30", icon: AlertTriangle, color: "#F97316" },
  Medium: { border: "border-l-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", ring: "", icon: AlertCircle, color: "#EAB308" },
  Low: { border: "border-l-neutral-500", bg: "bg-slate-500/10", text: "text-muted-foreground", ring: "", icon: Info, color: "#64748B" },
};

function CollapsibleCategorySection({ category, issues, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {category}
        </span>
        <Badge variant="outline">{issues.length}</Badge>
      </button>
      {open && (
        <CardContent className="space-y-3 border-t border-border pt-4">
          {issues.map((issue, idx) => {
            const cfg = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.Medium;
            const Icon = cfg.icon;
            return (
              <div
                key={idx}
                className={`flex flex-col gap-4 rounded-xl border border-border border-l-4 ${cfg.border} bg-card p-5 transition-colors hover:border-[#475569] md:flex-row`}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${cfg.text}`} />
                    <Badge value={issue.priority} />
                    <span className="text-xs font-medium text-muted-foreground">{category}</span>
                  </div>
                  <h3 className="text-sm font-medium leading-snug text-foreground">{issue.message || "—"}</h3>
                  {issue.url && (
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 break-all font-mono text-xs text-link hover:underline"
                    >
                      {issue.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}
                </div>
                <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-link">Fix Recommendation</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{issue.recommendation || "—"}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

export default function IssuesScreen({ report }) {
  const { categories } = report.data;
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const allIssues = useMemo(
    () =>
      categories.flatMap((c) => c.issues.map((issue) => ({ ...issue, category: c.name, categoryId: c.id }))),
    [categories],
  );

  const filtered = allIssues.filter(
    (i) =>
      (categoryFilter === "all" || i.categoryId === categoryFilter) &&
      (priorityFilter === "all" || i.priority === priorityFilter),
  );

  // Charts reflect category filter only (matches the reference: "not priority filter").
  const chartScoped = allIssues.filter((i) => categoryFilter === "all" || i.categoryId === categoryFilter);

  const priorityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const i of chartScoped) counts[i.priority] = (counts[i.priority] || 0) + 1;
    return counts;
  }, [chartScoped]);

  const byCategoryData = useMemo(() => {
    const counts = new Map();
    for (const i of chartScoped) counts.set(i.category, (counts.get(i.category) || 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    if (sorted.length <= MAX_CATEGORY_CHART) return sorted;
    const top = sorted.slice(0, MAX_CATEGORY_CHART - 1);
    const otherCount = sorted.slice(MAX_CATEGORY_CHART - 1).reduce((s, d) => s + d.count, 0);
    return [...top, { name: "Other", count: otherCount }];
  }, [chartScoped]);

  // recharts' Pie fails to render ANY sector (not just the zero one) when a
  // zero-value entry is mixed with non-zero entries, so zero-count priorities
  // are excluded here (unlike the reference's Chart.js doughnut, which handles
  // zero-value slices fine).
  const byPriorityData = useMemo(
    () =>
      PRIORITIES.map((p) => ({ name: p, value: priorityCounts[p] || 0, color: PRIORITY_CONFIG[p].color })).filter(
        (d) => d.value > 0,
      ),
    [priorityCounts],
  );

  const grouped = useMemo(() => {
    const byCategory = new Map();
    for (const issue of filtered) {
      if (!byCategory.has(issue.category)) byCategory.set(issue.category, []);
      byCategory.get(issue.category).push(issue);
    }
    return [...byCategory.entries()];
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Site Audit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allIssues.length} issue{allIssues.length === 1 ? "" : "s"} found across all categories.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HorizontalBarChartCard
          title="Issues by category"
          subtitle="Reflects current category filter, not priority filter."
          data={byCategoryData}
          yWidth={130}
        />

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Issues by priority</CardTitle>
            <p className="text-xs text-muted-foreground">Same slice as category chart (category filter only).</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byPriorityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} isAnimationActive={false}>
                  {byPriorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PRIORITIES.map((p) => {
          const cfg = PRIORITY_CONFIG[p];
          const Icon = cfg.icon;
          const count = priorityCounts[p] || 0;
          const isActive = priorityFilter === p;
          return (
            <Card
              key={p}
              shadow
              onClick={() => setPriorityFilter((prev) => (prev === p ? "all" : p))}
              className={`cursor-pointer select-none border-border bg-card transition-all ${
                isActive ? `${cfg.ring || "ring-1 ring-neutral-500/20"}` : "hover:border-[#475569]"
              }`}
            >
              <CardContent className="p-4">
                <div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
                  <Icon className="h-4 w-4" /> {p}
                </div>
                <div className={`text-3xl font-bold ${count > 0 ? cfg.text : "text-muted-foreground"}`}>{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPriorityFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            priorityFilter === "all" ? "border-foreground text-foreground" : "border-border text-muted-foreground"
          }`}
        >
          All Priorities
        </button>
        {PRIORITIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriorityFilter(p)}
            style={priorityFilter === p ? { borderColor: PRIORITY_CONFIG[p].color, color: PRIORITY_CONFIG[p].color } : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              priorityFilter === p ? "" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}
          </button>
        ))}

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="ml-auto rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-[#6366F1] focus:outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.issues.length})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {grouped.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No issues match this filter.
            </CardContent>
          </Card>
        ) : (
          grouped.map(([category, issues], idx) => (
            <CollapsibleCategorySection key={category} category={category} issues={issues} defaultOpen={idx === 0} />
          ))
        )}
      </div>
    </div>
  );
}
