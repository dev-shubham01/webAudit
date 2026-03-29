import { AlertCircle, Search, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { bandStyles, cardShell, kpiHint, scoreBand } from "./dashboard.utils";

const KPI_ITEMS = [
  { title: "Performance", kind: "performance", icon: TrendingUp },
  { title: "SEO", kind: "seo", icon: Search },
  { title: "Stability", kind: "stability", icon: AlertCircle },
];

export default function KpiSection({ perfScore, seoScore, stabilityScore }) {
  const valueMap = {
    performance: perfScore,
    seo: seoScore,
    stability: stabilityScore,
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {KPI_ITEMS.map((item) => {
        const value = valueMap[item.kind];
        const band = scoreBand(value);
        const b = bandStyles[band];
        const IconComponent = item.icon;

        return (
          <Card key={item.title} className={`${cardShell} relative overflow-hidden pl-1`}>
            <div className={`absolute left-0 top-0 h-full w-1 ${b.bar}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-5">
              <CardTitle className="text-sm font-medium text-[#94A3B8]">
                {item.title}
              </CardTitle>
              <IconComponent className={`h-5 w-5 ${b.text}`} />
            </CardHeader>
            <CardContent className="pl-5">
              <div className={`text-4xl font-bold tabular-nums ${b.text}`}>
                {Math.round(Number(value) || 0)}
              </div>
              <p className="mt-3 text-sm leading-snug text-[#94A3B8]">
                {kpiHint(item.kind, value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
