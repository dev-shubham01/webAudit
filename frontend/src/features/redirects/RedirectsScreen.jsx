import { useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";

export default function RedirectsScreen({ report }) {
  const { redirects } = report.data;

  const chartData = useMemo(() => {
    const counts = new Map();
    for (const r of redirects) {
      const key = String(r.status);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [redirects]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E2E8F0]">Redirects</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          {redirects.length} page{redirects.length === 1 ? "" : "s"} redirected during the crawl.
        </p>
      </div>

      {chartData.length > 0 && (
        <HorizontalBarChartCard title="Redirects by status code" data={chartData} yWidth={60} />
      )}

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#334155] text-xs uppercase text-[#64748B]">
                <th className="px-6 py-2 font-medium">From (requested URL)</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">To (final URL)</th>
              </tr>
            </thead>
            <tbody>
              {redirects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[#64748B]">
                    No redirects found.
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr key={r.url} className="border-b border-[#334155]/50">
                    <td className="max-w-sm truncate px-6 py-2 font-mono text-xs text-[#CBD5E1]" title={r.url}>
                      {r.url}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">{r.status}</Badge>
                    </td>
                    <td className="max-w-sm truncate px-4 py-2 font-mono text-xs text-[#94A3B8]" title={r.finalUrl}>
                      {r.finalUrl}
                    </td>
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
