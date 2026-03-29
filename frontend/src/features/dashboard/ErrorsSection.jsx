import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  cardShell,
  insightSeverityStyle,
  sectionDescClass,
  sectionTitleClass,
} from "./dashboard.utils";

export default function ErrorsSection({ errorItems }) {
  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={sectionTitleClass}>Errors</CardTitle>
        <p className={sectionDescClass}>Console and failed network responses</p>
      </CardHeader>
      <CardContent className="pt-6">
        {errorItems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 px-4 py-5 text-[#86EFAC]">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-[#22C55E]" aria-hidden />
            <span className="font-medium">
              <span aria-hidden>✅ </span>
              No critical errors detected
            </span>
          </div>
        ) : (
          <ul className="space-y-4">
            {errorItems.map((item) => {
              const st = insightSeverityStyle(item.severity);
              return (
                <li
                  key={item.key}
                  className="flex gap-3 rounded-xl border border-[#334155] bg-[#0F172A]/60 p-4 transition-all duration-200 hover:bg-[#0F172A]/90"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${st.dot}`} />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${st.badge}`}
                    >
                      {item.severity}
                    </span>
                    <p className="mt-2 break-words font-mono text-sm text-[#E2E8F0]">
                      {item.message}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
