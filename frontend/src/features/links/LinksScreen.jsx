import { useMemo, useState } from "react";
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

function FilterSelect({ label, options, value, onChange }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-[#334155] bg-[#1E293B] px-3 py-1.5 text-xs text-[#E2E8F0] focus:border-[#6366F1] focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
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
  const [selectedUrl, setSelectedUrl] = useState(null);

  const filtered = useMemo(() => {
    const inlinksTest = INLINKS_FILTERS.find((f) => f.id === inlinksFilter)?.test ?? (() => true);
    const statusTest = STATUS_FILTERS.find((f) => f.id === statusFilter)?.test ?? (() => true);
    const rtTest = RESPONSE_TIME_FILTERS.find((f) => f.id === rtFilter)?.test ?? (() => true);
    const wcTest = WORD_COUNT_FILTERS.find((f) => f.id === wcFilter)?.test ?? (() => true);
    return links.filter((p) => inlinksTest(p) && statusTest(p) && rtTest(p) && wcTest(p));
  }, [links, inlinksFilter, statusFilter, rtFilter, wcFilter]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Link Explorer</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          {links.length} crawled page{links.length === 1 ? "" : "s"}. Click a row to inspect a page in
          detail.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HorizontalBarChartCard title="All crawled URLs by status" data={statusChartData} />
        <HorizontalBarChartCard title="Word count bands" data={wordCountChartData} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect label="Inlinks" options={INLINKS_FILTERS} value={inlinksFilter} onChange={setInlinksFilter} />
        <FilterSelect label="Status" options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <FilterSelect label="Response time" options={RESPONSE_TIME_FILTERS} value={rtFilter} onChange={setRtFilter} />
        <FilterSelect label="Word count" options={WORD_COUNT_FILTERS} value={wcFilter} onChange={setWcFilter} />
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#334155] text-xs uppercase text-[#64748B]">
                <th className="px-6 py-2 font-medium">Page</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Links in</th>
                <th className="px-4 py-2 font-medium">Crawl depth</th>
                <th className="px-4 py-2 font-medium">Load time</th>
                <th className="px-4 py-2 font-medium">Words</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#64748B]">
                    No pages match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((page) => {
                  const isBroken = (typeof page.status === "number" && page.status >= 400) || page.status === "error";
                  return (
                    <tr
                      key={page.url}
                      onClick={() => setSelectedUrl(page.url)}
                      className="cursor-pointer border-b border-[#334155]/50 hover:bg-[#0F172A]/60"
                    >
                      <td className="max-w-sm truncate px-6 py-2 text-[#CBD5E1]" title={page.url}>
                        <div className="font-medium">{page.title || "No title"}</div>
                        <div className="truncate text-xs text-[#64748B]">{page.url}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={isBroken ? "destructive" : "outline"}>{page.status}</Badge>
                      </td>
                      <td className="px-4 py-2 text-[#94A3B8]">{page.inlinksCount}</td>
                      <td className="px-4 py-2 text-[#94A3B8]">{page.depth}</td>
                      <td className="px-4 py-2 text-[#94A3B8]">
                        {page.responseTimeMs ? `${page.responseTimeMs}ms` : "—"}
                      </td>
                      <td className="px-4 py-2 text-[#94A3B8]">{page.wordCount.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedPage && <LinkInspector page={selectedPage} onClose={() => setSelectedUrl(null)} />}
    </div>
  );
}
