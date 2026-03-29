import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  cardShell,
  insightSeverityStyle,
  sectionDescClass,
  sectionTitleClass,
  severityEmoji,
} from "./dashboard.utils";

export default function InsightsSection({ insights }) {
  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={`flex items-center gap-2 ${sectionTitleClass}`}>
          <Lightbulb className="h-5 w-5 shrink-0 text-[#6366F1]" />
          Insights
        </CardTitle>
        <p className={sectionDescClass}>Prioritized actions to improve your site</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {insights.length === 0 ? (
          <p className="rounded-lg border border-[#334155] bg-[#0F172A]/80 px-4 py-6 text-center text-sm text-[#94A3B8]">
            No issues flagged for this scan. Keep monitoring as you ship changes.
          </p>
        ) : (
          insights.map((item, i) => {
            const sev = insightSeverityStyle(item.severity);
            const message = item.message ?? "Issue";
            return (
              <div
                key={i}
                className={`rounded-xl border border-[#334155] bg-[#0F172A]/60 pl-4 transition-all duration-200 ${sev.border} border-l-4 hover:bg-[#0F172A]/90`}
              >
                <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${sev.badge}`}
                      >
                        <span className="mr-1" aria-hidden>
                          {severityEmoji(item.severity)}
                        </span>
                        {String(item.severity || "low")}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                        {item.type ?? "General"}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-[#E2E8F0]">{message}</p>
                    {item.why ? (
                      <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                        <span className="font-medium text-[#CBD5E1]">Why it matters: </span>
                        {item.why}
                      </p>
                    ) : null}
                    {item.fix ? (
                      <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                        <span className="font-medium text-[#CBD5E1]">Fix: </span>
                        {item.fix}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
