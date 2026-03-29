import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cardShell, sectionDescClass, sectionTitleClass } from "./dashboard.utils";

export default function LinksSection({
  totalLinksCount,
  brokenLinksCount,
  successLinksCount,
  brokenLinks,
}) {
  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={sectionTitleClass}>Links</CardTitle>
        <p className={sectionDescClass}>Link health summary from checked page anchors</p>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#334155] bg-[#0F172A]/60 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Total Links</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[#E2E8F0]">{totalLinksCount}</p>
          </div>
          <div
            className={`rounded-xl border px-4 py-4 ${
              brokenLinksCount > 0
                ? "border-[#EF4444]/40 bg-[#EF4444]/10"
                : "border-[#334155] bg-[#0F172A]/60"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Broken Links</p>
            <p
              className={`mt-2 text-3xl font-bold tabular-nums ${
                brokenLinksCount > 0 ? "text-[#FCA5A5]" : "text-[#E2E8F0]"
              }`}
            >
              {brokenLinksCount}
            </p>
          </div>
          <div className="rounded-xl border border-[#334155] bg-[#0F172A]/60 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Success Count</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[#86EFAC]">
              {successLinksCount}
            </p>
          </div>
        </div>

        {brokenLinksCount > 0 ? (
          <div className="rounded-xl border border-[#EF4444]/40 bg-[#7F1D1D]/20 p-4">
            <p className="mb-3 text-sm font-semibold text-[#FCA5A5]">Broken link list</p>
            <ul className="space-y-2">
              {brokenLinks.map((item, index) => {
                const urlText =
                  typeof item?.url === "string" && item.url.trim() ? item.url : "Unknown URL";
                const statusText =
                  item?.status == null ? "request failed" : `HTTP ${item.status}`;
                return (
                  <li
                    key={`${urlText}-${index}`}
                    className="rounded-lg border border-[#EF4444]/30 bg-[#0F172A]/70 px-3 py-2 text-sm text-[#FECACA]"
                  >
                    <span className="font-medium text-[#FCA5A5]">{statusText}</span>
                    <span className="mx-2 text-[#7F1D1D]">-</span>
                    <span className="break-all">{urlText}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 px-4 py-4 text-[#86EFAC]">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#22C55E]" aria-hidden />
            <p className="font-medium">✅ No broken links detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
