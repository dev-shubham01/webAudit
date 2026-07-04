import { useEffect, useMemo, useState } from "react";
import { ExternalLink, CheckCircle2, FileText, Copy } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";
import { CONTENT_FILTERS, buildContentUrls } from "./content.utils.js";

const PER_PAGE = 50;

export default function ContentScreen({ report }) {
  const { links, contentDuplicates } = report.data;
  const contentUrls = useMemo(() => buildContentUrls(links), [links]);
  const [filterKey, setFilterKey] = useState("missing_h1");
  const [page, setPage] = useState(1);

  const list = contentUrls[filterKey] || [];
  const totalIssues = CONTENT_FILTERS.reduce((sum, f) => sum + (contentUrls[f.key] || []).length, 0);

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageSlice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const rowFrom = list.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rowTo = Math.min(page * PER_PAGE, list.length);

  const issueBarData = CONTENT_FILTERS.map((f) => ({ name: f.label, count: (contentUrls[f.key] || []).length }));
  const activeFilter = CONTENT_FILTERS.find((f) => f.key === filterKey);
  const showMetricCol =
    filterKey === "meta_desc_short" || filterKey === "meta_desc_long" || filterKey === "multiple_h1" || filterKey === "thin_content";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">On-Page SEO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit missing or duplicate titles, meta descriptions, and H1 tags. {totalIssues} total{" "}
          {totalIssues === 1 ? "issue" : "issues"} detected.
        </p>
      </div>

      {contentDuplicates?.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Copy className="h-4 w-4 text-violet-400" />
              <h2 className="text-sm font-bold text-foreground">Near-duplicate clusters</h2>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-xs uppercase text-[#64748B]">
                    <th className="px-4 py-2 font-medium">Cluster</th>
                    <th className="px-4 py-2 font-medium">Representative</th>
                    <th className="px-4 py-2 text-right font-medium">URLs</th>
                  </tr>
                </thead>
                <tbody>
                  {contentDuplicates.slice(0, 40).map((g) => (
                    <tr key={g.id} className="border-t border-border/50">
                      <td className="px-4 py-2 font-mono text-xs text-violet-300">{g.id}</td>
                      <td className="max-w-md px-4 py-2">
                        <a
                          href={g.representativeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all font-mono text-xs text-link hover:underline"
                        >
                          {g.representativeUrl}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-muted-foreground">{g.memberCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalIssues > 0 && (
        <HorizontalBarChartCard
          title="Issues by type"
          subtitle="URL count per on-page issue category"
          data={issueBarData}
          yWidth={140}
          height={352}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {CONTENT_FILTERS.map(({ key, label }) => {
          const count = (contentUrls[key] || []).length;
          const hasIssues = count > 0;
          const isActive = filterKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilterKey(key)}
              className={`rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? hasIssues
                    ? "border-red-500/40 bg-red-500/10 ring-1 ring-red-500/20"
                    : "border-green-500/40 bg-green-500/10 ring-1 ring-green-500/20"
                  : hasIssues
                    ? "border-amber-700/40 bg-card hover:border-amber-600/60"
                    : "border-border bg-card opacity-60 hover:border-[#475569]"
              }`}
            >
              <div className={`text-xl font-bold ${hasIssues ? (isActive ? "text-red-400" : "text-amber-400") : "text-green-400"}`}>
                {count}
              </div>
              <div className="mt-0.5 text-xs leading-tight text-muted-foreground">{label}</div>
            </button>
          );
        })}
      </div>

      {activeFilter?.guidance && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#6366F1]" />
          <p className="text-sm leading-relaxed text-foreground">{activeFilter.guidance}</p>
        </div>
      )}

      <Card className="flex flex-col border-border bg-card">
        {list.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="text-sm font-medium text-muted-foreground">No URLs affected by this issue.</p>
            <p className="text-xs text-[#64748B]">Great job — nothing to fix here.</p>
          </CardContent>
        ) : (
          <>
            <div className="space-y-1.5 border-b border-border bg-background/50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{activeFilter?.label}</span>
                <span className="shrink-0 text-xs text-[#64748B]">
                  {list.length} {list.length === 1 ? "URL" : "URLs"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rows are pages that match the selected issue. Swipe sideways on small screens to see all columns.
              </p>
            </div>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-[#64748B]">
                    <th className="w-12 px-4 py-2 text-center font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Page</th>
                    {showMetricCol && (
                      <th className="px-4 py-2 text-center font-medium">
                        {filterKey === "multiple_h1" ? "H1 Count" : filterKey === "thin_content" ? "Chars" : "Length"}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((item, i) => {
                    const rowNum = (page - 1) * PER_PAGE + i + 1;
                    return (
                      <tr key={`${item.url}-${rowNum}`} className="border-b border-border/50">
                        <td className="px-4 py-2 text-center text-sm font-semibold tabular-nums text-[#64748B]">{rowNum}</td>
                        <td className="px-4 py-2">
                          <div className="line-clamp-2 text-sm font-medium text-foreground" title={item.title || undefined}>
                            {item.title || <span className="font-normal italic text-[#64748B]">No title</span>}
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            title={item.url}
                            className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#6366F1]"
                          >
                            <span className="truncate font-mono">{item.url}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        </td>
                        {showMetricCol && (
                          <td className="px-4 py-2 text-center">
                            <span className="text-sm font-bold tabular-nums text-amber-400">
                              {filterKey === "multiple_h1"
                                ? item.h1Count
                                : filterKey === "thin_content"
                                  ? item.contentLength
                                  : item.metaDescLen}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
            <div className="flex flex-col gap-3 border-t border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5 text-sm text-muted-foreground">
                <div>
                  Showing {rowFrom}–{rowTo} of {list.length}
                </div>
                <div>
                  Page <span className="font-bold text-foreground">{page}</span> of{" "}
                  <span className="font-bold text-foreground">{totalPages}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
