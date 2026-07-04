import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ExternalLink, Globe, ArrowRight, Search } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useReport } from "../../context/ReportContext.jsx";
import { groupReportsByDomain, healthScoreClass } from "./home.utils.js";

const STATUS_PILLS = [
  { key: "s2xx", label: "2xx", className: "bg-emerald-500/15 text-emerald-300" },
  { key: "s3xx", label: "3xx", className: "bg-sky-500/15 text-sky-300" },
  { key: "s4xx", label: "4xx", className: "bg-amber-500/15 text-amber-300" },
  { key: "s5xx", label: "5xx", className: "bg-rose-500/15 text-rose-300" },
];

export default function HomeScreen() {
  const { reportList, refreshReportList, loadReport } = useReport();
  const [filterQuery, setFilterQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    refreshReportList();
  }, [refreshReportList]);

  const domainGroups = useMemo(() => groupReportsByDomain(reportList), [reportList]);

  const portfolioTotals = useMemo(() => {
    const totalBrands = domainGroups.length;
    const totalUrls = domainGroups.reduce((sum, g) => sum + g.urlCount, 0);
    const avgHealth = totalBrands
      ? Math.round(domainGroups.reduce((sum, g) => sum + g.healthScore, 0) / totalBrands)
      : null;
    return { totalBrands, totalUrls, avgHealth };
  }, [domainGroups]);

  const filteredGroups = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return domainGroups;
    return domainGroups.filter(
      (group) => group.domainName.toLowerCase().includes(q) || group.crawlUrl.toLowerCase().includes(q),
    );
  }, [domainGroups, filterQuery]);

  const handleOpen = async (group) => {
    try {
      await loadReport(group.reportId);
      navigate("/dashboard");
    } catch {
      /* error shown in ReportProvider banner */
    }
  };

  return (
    <div className="relative overflow-hidden pt-2">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f19]/15 via-transparent to-[#0b0f19]/20" />
      </div>

      <div className="flex min-h-[38vh] items-center justify-center">
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-foreground">Home</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a domain to open the full dashboard view.</p>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search Domain or crawl URLs..."
              className="w-full rounded-full border border-border bg-card/60 px-9 py-2.5 text-sm text-foreground outline-none placeholder:text-[#64748B] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Brands</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                {portfolioTotals.totalBrands.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total URLs</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                {portfolioTotals.totalUrls.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Average Health</p>
              <p
                className={`mt-0.5 text-lg font-bold tabular-nums ${
                  portfolioTotals.avgHealth != null ? healthScoreClass(portfolioTotals.avgHealth) : "text-foreground"
                }`}
              >
                {portfolioTotals.avgHealth ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {filteredGroups.length > 0 ? (
        <div className="mt-2 flex flex-row flex-wrap items-stretch justify-center gap-4">
          {filteredGroups.map((group) => (
            <button
              key={group.domainName}
              type="button"
              onClick={() => handleOpen(group)}
              className="w-[min(260px,100%)] min-w-0 max-w-[260px] text-left"
            >
              <Card className="h-full border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6366F1]/45">
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        Domain
                      </p>
                      <h3 className="truncate text-sm font-semibold text-foreground">{group.domainName}</h3>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Health Score</p>
                      <p className={`text-base font-bold tabular-nums ${healthScoreClass(group.healthScore)}`}>
                        {group.healthScore}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-background/60 px-2 py-1.5">
                    <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Crawl URL</p>
                    <a
                      href={group.crawlUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={group.crawlUrl}
                      className="inline-flex max-w-full items-center gap-1 text-xs text-[#6366F1] hover:underline"
                    >
                      <span className="truncate font-mono">{group.crawlUrl}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </a>
                  </div>

                  <div className="rounded-md border border-border bg-background/60 px-2 py-1.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">URL Count</p>
                        <p className="mt-1 text-lg font-semibold leading-none tabular-nums text-foreground">
                          {group.urlCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Crawl</p>
                        <p className="mt-1 truncate text-xs text-foreground" title={group.lastCrawl || "—"}>
                          {group.lastCrawl || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-border px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status Breakdown</p>
                      <div className="flex items-center gap-1 text-xs font-medium text-[#6366F1]">
                        <Globe className="h-3.5 w-3.5" />
                        Open Brand
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] tabular-nums">
                      {STATUS_PILLS.map(({ key, label, className }) => (
                        <span key={key} className={`rounded-md px-2 py-0.5 ${className}`}>
                          {label} {group.statusCounts[key]}
                        </span>
                      ))}
                      {group.statusCounts.other > 0 && (
                        <span className="rounded-md bg-slate-500/15 px-2 py-0.5 text-slate-300">
                          Other {group.statusCounts.other}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {filterQuery ? "No Domain match your search." : "No crawl URLs available to group by domain yet."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
