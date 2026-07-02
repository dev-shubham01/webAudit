import { useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";
import { categorizeTech, buildTechSummary } from "./techStack.utils.js";

export default function TechStackScreen({ report }) {
  const { links } = report.data;

  const techs = useMemo(() => buildTechSummary(links), [links]);
  const totalAnalyzed = links.length;

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const t of techs) {
      const cat = categorizeTech(t.name);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [techs]);

  const chartData = techs.map((t) => ({ name: t.name, count: t.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Tech Detection</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Technologies detected across {totalAnalyzed.toLocaleString()} analyzed pages.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(categoryCounts)
          .slice(0, 4)
          .map(([cat, count]) => (
            <Card key={cat} className="border-[#334155] bg-[#1E293B]">
              <CardContent className="p-4">
                <div className="mb-1 text-xs font-bold uppercase text-[#94A3B8]">{cat}</div>
                <div className="text-2xl font-bold text-[#E2E8F0]">{count}</div>
                <div className="mt-1 text-[10px] text-[#64748B]">technologies detected</div>
              </CardContent>
            </Card>
          ))}
      </div>

      {chartData.length > 0 ? (
        <HorizontalBarChartCard
          title="Detected Technologies"
          subtitle="Number of pages where each technology was found"
          data={chartData}
          yWidth={140}
          height={Math.max(200, chartData.length * 32 + 40)}
        />
      ) : (
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-8 text-center text-sm text-[#94A3B8]">No technology data. Run a crawl first.</CardContent>
        </Card>
      )}

      {techs.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-[#E2E8F0]">Technology Breakdown</h2>
          <Card className="border-[#334155] bg-[#1E293B]">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#334155] text-xs uppercase text-[#64748B]">
                    <th className="px-6 py-2 font-medium">Technology</th>
                    <th className="px-4 py-2 font-medium">Category</th>
                    <th className="px-4 py-2 text-right font-medium">Pages</th>
                    <th className="px-4 py-2 font-medium">Sample URLs</th>
                  </tr>
                </thead>
                <tbody>
                  {techs.map((t) => (
                    <tr key={t.name} className="border-b border-[#334155]/50">
                      <td className="px-6 py-2 font-medium text-[#E2E8F0]">{t.name}</td>
                      <td className="px-4 py-2 text-xs text-[#94A3B8]">{categorizeTech(t.name)}</td>
                      <td className="px-4 py-2 text-right font-mono text-[#94A3B8]">{t.count.toLocaleString()}</td>
                      <td className="max-w-md px-4 py-2 text-xs">
                        {t.sampleUrls.map((u) => (
                          <a
                            key={u}
                            href={u}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-[#6366F1] hover:underline"
                          >
                            {u.replace(/^https?:\/\//, "").slice(0, 60)}
                          </a>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
