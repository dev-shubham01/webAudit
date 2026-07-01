import { useMemo, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CONTENT_FILTERS } from "./content.utils.js";

export default function ContentScreen({ report }) {
  const { links } = report.data;
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    const filter = CONTENT_FILTERS.find((f) => f.id === activeFilter) ?? CONTENT_FILTERS[0];
    return links.filter(filter.test);
  }, [links, activeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Content</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Per-page SEO and content fields across {links.length} crawled page{links.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_FILTERS.map((filter) => {
          const count = filter.id === "all" ? links.length : links.filter(filter.test).length;
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]"
                  : "border-[#334155] text-[#94A3B8] hover:border-[#6366F1]/50 hover:text-[#E2E8F0]"
              }`}
            >
              {filter.label} <span className="text-[#64748B]">({count})</span>
            </button>
          );
        })}
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#334155] text-xs uppercase text-[#64748B]">
                <th className="px-6 py-2 font-medium">URL</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Meta desc.</th>
                <th className="px-4 py-2 font-medium">H1s</th>
                <th className="px-4 py-2 font-medium">Words</th>
                <th className="px-4 py-2 font-medium">Status</th>
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
                filtered.map((page) => (
                  <tr key={page.url} className="border-b border-[#334155]/50">
                    <td className="max-w-xs truncate px-6 py-2 text-[#CBD5E1]" title={page.url}>
                      {page.url}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-[#94A3B8]" title={page.title}>
                      {page.title || <span className="text-[#EF4444]">Missing</span>}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-2 text-[#94A3B8]"
                      title={page.metaDescription}
                    >
                      {page.metaDescription || <span className="text-[#EF4444]">Missing</span>}
                    </td>
                    <td className="px-4 py-2 text-[#94A3B8]">
                      {page.h1Count === 0 ? (
                        <Badge variant="destructive">0</Badge>
                      ) : page.h1Count > 1 ? (
                        <Badge variant="secondary">{page.h1Count}</Badge>
                      ) : (
                        page.h1Count
                      )}
                    </td>
                    <td className="px-4 py-2 text-[#94A3B8]">{page.wordCount}</td>
                    <td className="px-4 py-2 text-[#94A3B8]">{page.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
