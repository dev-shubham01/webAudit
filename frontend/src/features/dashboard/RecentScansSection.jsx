import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { bandStyles, cardShell, scoreBand, sectionDescClass, sectionTitleClass } from "./dashboard.utils";

export default function RecentScansSection({ host, overallScore, scoreLabel, dateLabel }) {
  const heroBand = scoreBand(overallScore);
  const style = bandStyles[heroBand];

  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={sectionTitleClass}>Recent scans</CardTitle>
        <p className={sectionDescClass}>
          Latest scan shown below — run again from the header to refresh
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">Website</th>
                <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">Score</th>
                <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">Status</th>
                <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 text-[#E2E8F0]">{host}</td>
                <td className="py-3">
                  <span className={`font-semibold tabular-nums ${style.text}`}>
                    {Math.round(overallScore)}
                  </span>
                </td>
                <td className="py-3">
                  <Badge className={`${style.bg} ${style.text} border-0`}>{scoreLabel ?? "—"}</Badge>
                </td>
                <td className="py-3 text-[#94A3B8]">{dateLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
