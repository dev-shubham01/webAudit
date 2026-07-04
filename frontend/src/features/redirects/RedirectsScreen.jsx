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
        <h1 className="text-3xl font-bold text-foreground">Redirects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {redirects.length} page{redirects.length === 1 ? "" : "s"} redirected during the crawl.
        </p>
      </div>

      {chartData.length > 0 && (
        <div className="max-w-xl">
          <HorizontalBarChartCard
            title="Redirects by status code"
            subtitle="How many redirect responses use each HTTP status"
            data={chartData}
            yWidth={60}
            height={192}
          />
        </div>
      )}

      <Card className="border-border bg-card">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-6 py-2 font-medium">From (requested URL)</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">To (final URL)</th>
              </tr>
            </thead>
            <tbody>
              {redirects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No redirects found.
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr key={r.url} className="border-b border-border/50">
                    <td className="max-w-sm px-6 py-2 font-mono text-xs">
                      <a href={r.url} target="_blank" rel="noreferrer" className="break-all text-link hover:underline">
                        {r.url}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <Badge value={r.status} />
                    </td>
                    <td className="max-w-sm px-4 py-2 font-mono text-xs">
                      <a href={r.finalUrl} target="_blank" rel="noreferrer" className="break-all text-foreground hover:underline hover:text-link">
                        {r.finalUrl}
                      </a>
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
