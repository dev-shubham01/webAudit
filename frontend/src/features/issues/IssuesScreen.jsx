import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ResponsiveContainer, Cell, PieChart, Pie, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { PRIORITY_CONFIG } from "../../utils/chartPalette.js";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

function priorityVariant(priority) {
  if (priority === "Critical") return "destructive";
  if (priority === "High") return "destructive";
  if (priority === "Medium") return "secondary";
  return "outline";
}

function CollapsibleCategorySection({ category, issues }) {
  const [open, setOpen] = useState(true);

  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-[#E2E8F0]">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {category}
        </span>
        <Badge variant="outline">{issues.length}</Badge>
      </button>
      {open && (
        <CardContent className="space-y-3 border-t border-[#334155] pt-4">
          {issues.map((issue, idx) => (
            <div key={idx} className="rounded-md border border-[#334155] p-3">
              <div className="flex items-start gap-3">
                <Badge variant={priorityVariant(issue.priority)} className="mt-0.5 shrink-0">
                  {issue.priority}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#E2E8F0]">{issue.message}</p>
                  {issue.url && (
                    <p className="mt-1 truncate text-xs text-[#64748B]" title={issue.url}>
                      {issue.url}
                    </p>
                  )}
                  {issue.recommendation && (
                    <div className="mt-2 rounded-md bg-[#0F172A] p-2 text-xs text-[#94A3B8]">
                      {issue.recommendation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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

  const byCategoryData = useMemo(() => {
    const counts = new Map();
    for (const i of chartScoped) counts.set(i.category, (counts.get(i.category) || 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [chartScoped]);

  const byPriorityData = useMemo(
    () =>
      PRIORITIES.map((p) => ({
        name: p,
        value: chartScoped.filter((i) => i.priority === p).length,
        color: PRIORITY_CONFIG[p].color,
      })).filter((d) => d.value > 0),
    [chartScoped],
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
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Site Audit</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
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

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#E2E8F0]">Issues by priority</CardTitle>
            <p className="text-xs text-[#64748B]">Same slice as category chart (category filter only).</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byPriorityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {byPriorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #334155", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPriorityFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            priorityFilter === "all" ? "border-[#E2E8F0] text-[#E2E8F0]" : "border-[#334155] text-[#64748B]"
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
              priorityFilter === p ? "" : "border-[#334155] text-[#64748B] hover:text-[#E2E8F0]"
            }`}
          >
            {p}
          </button>
        ))}

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="ml-auto rounded-md border border-[#334155] bg-[#1E293B] px-3 py-1.5 text-xs text-[#E2E8F0] focus:border-[#6366F1] focus:outline-none"
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
          <Card className="border-[#334155] bg-[#1E293B]">
            <CardContent className="p-6 text-center text-sm text-[#94A3B8]">
              No issues match this filter.
            </CardContent>
          </Card>
        ) : (
          grouped.map(([category, issues]) => (
            <CollapsibleCategorySection key={category} category={category} issues={issues} />
          ))
        )}
      </div>
    </div>
  );
}
