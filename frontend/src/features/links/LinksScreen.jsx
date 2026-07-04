import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  INLINKS_FILTERS,
  STATUS_FILTERS,
  RESPONSE_TIME_FILTERS,
  WORD_COUNT_FILTERS,
} from "./links.utils.js";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";
import LinkInspector from "./LinkInspector.jsx";

const PAGE_SIZE = 50;

function FilterSelect({ label, options, value, onChange }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-[#6366F1] focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SortTh({ label, sortKey, activeKey, direction, onSort, className = "" }) {
  const isActive = activeKey === sortKey;
  return (
    <th className={`px-4 py-2 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${isActive ? "text-foreground" : ""}`}
      >
        {label}
        {isActive ? (
          direction === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function wordCountBand(wordCount) {
  if (!wordCount) return "No / zero words";
  if (wordCount < 300) return "Thin (<300)";
  if (wordCount < 1000) return "Medium (300–999)";
  return "Long (1000+)";
}

export default function LinksScreen({ report }) {
  const { links } = report.data;
  const [inlinksFilter, setInlinksFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rtFilter, setRtFilter] = useState("all");
  const [wcFilter, setWcFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [selectedUrl, setSelectedUrl] = useState(null);

  const filtered = useMemo(() => {
    const inlinksTest = INLINKS_FILTERS.find((f) => f.id === inlinksFilter)?.test ?? (() => true);
    const statusTest = STATUS_FILTERS.find((f) => f.id === statusFilter)?.test ?? (() => true);
    const rtTest = RESPONSE_TIME_FILTERS.find((f) => f.id === rtFilter)?.test ?? (() => true);
    const wcTest = WORD_COUNT_FILTERS.find((f) => f.id === wcFilter)?.test ?? (() => true);
    const q = searchQuery.trim().toLowerCase();
    return links.filter(
      (p) =>
        inlinksTest(p) &&
        statusTest(p) &&
        rtTest(p) &&
        wcTest(p) &&
        (!q || p.url.toLowerCase().includes(q) || (p.title || "").toLowerCase().includes(q) || String(p.status).includes(q)),
    );
  }, [links, inlinksFilter, statusFilter, rtFilter, wcFilter, searchQuery]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
  const maxInlinks = Math.max(1, ...links.map((l) => l.inlinksCount || 0));

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const statusChartData = useMemo(() => {
    const counts = new Map();
    for (const p of links) {
      const key = String(p.status);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [links]);

  const wordCountChartData = useMemo(() => {
    const bands = ["Thin (<300)", "Medium (300–999)", "Long (1000+)", "No / zero words"];
    const counts = new Map(bands.map((b) => [b, 0]));
    for (const p of links) {
      const band = wordCountBand(p.wordCount);
      counts.set(band, (counts.get(band) || 0) + 1);
    }
    return bands.map((name) => ({ name, count: counts.get(name) }));
  }, [links]);

  const selectedPage = links.find((p) => p.url === selectedUrl) || null;

  if (selectedPage) {
    return <LinkInspector page={selectedPage} report={report} onClose={() => setSelectedUrl(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Link Explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {links.length} crawled page{links.length === 1 ? "" : "s"}. Click a row to inspect a page in
          detail.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HorizontalBarChartCard title="All crawled URLs by status" subtitle="How many URLs return each HTTP status" data={statusChartData} />
        <HorizontalBarChartCard title="Word count bands" subtitle="Content depth across crawled pages" data={wordCountChartData} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by URL, title, or status…"
          className="w-64 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#6366F1] focus:outline-none"
        />
        <FilterSelect label="Inlinks" options={INLINKS_FILTERS} value={inlinksFilter} onChange={updateFilter(setInlinksFilter)} />
        <FilterSelect label="Status" options={STATUS_FILTERS} value={statusFilter} onChange={updateFilter(setStatusFilter)} />
        <FilterSelect label="Response time" options={RESPONSE_TIME_FILTERS} value={rtFilter} onChange={updateFilter(setRtFilter)} />
        <FilterSelect label="Word count" options={WORD_COUNT_FILTERS} value={wcFilter} onChange={updateFilter(setWcFilter)} />
      </div>

      <p className="sm:hidden text-xs text-muted-foreground">Swipe sideways to see all columns.</p>

      <Card className="overflow-hidden border-border bg-card p-0">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="sticky left-0 z-10 border-r border-border bg-card px-6 py-2 font-medium shadow-[4px_0_12px_-4px_rgba(0,0,0,0.45)]">
                  Page
                </th>
                <SortTh label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortTh label="Links in" sortKey="inlinksCount" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortTh label="Crawl depth" sortKey="depth" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortTh label="Load time" sortKey="responseTimeMs" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortTh label="Words" sortKey="wordCount" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No pages match this filter.
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => {
                  const inlinksPct = Math.round(((p.inlinksCount || 0) / maxInlinks) * 100);
                  return (
                    <tr
                      key={p.url}
                      onClick={() => setSelectedUrl(p.url)}
                      className="cursor-pointer border-b border-border/50 hover:bg-background/60"
                    >
                      <td className="sticky left-0 z-10 max-w-sm truncate border-r border-border bg-inherit px-6 py-2 text-foreground shadow-[4px_0_12px_-4px_rgba(0,0,0,0.35)]" title={p.url}>
                        <div className="truncate font-medium">{p.title || "No title"}</div>
                        <div className="truncate text-xs text-muted-foreground">{p.url}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge value={p.status} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400"
                              style={{ width: `${Math.max(4, inlinksPct)}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground">{p.inlinksCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{p.depth}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {p.responseTimeMs ? `${p.responseTimeMs}ms` : "—"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{p.wordCount.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {clampedPage} of {totalPages} · {sorted.length} result{sorted.length === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={clampedPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={clampedPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
