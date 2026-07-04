import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import LhDetailsTable from "./LhDetailsTable.jsx";

function severityBg(s) {
  if (!s) return "bg-border text-foreground";
  const sl = s.toLowerCase();
  if (sl === "critical") return "bg-red-500/20 text-red-300";
  if (sl === "high") return "bg-orange-500/20 text-orange-300";
  if (sl === "medium") return "bg-yellow-500/20 text-yellow-300";
  return "bg-border/60 text-muted-foreground";
}

export default function DiagnosticItem({ d }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-[#263449]"
      >
        <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${severityBg(d.severity)}`}>
          {d.severity || "Medium"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{d.warning || d.helpText || "—"}</div>
          {d.oneLineFix && <div className="mt-0.5 truncate text-xs text-[#6366F1]">Fix: {d.oneLineFix}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {d.primaryImpact && <span className="hidden text-xs text-muted-foreground sm:block">{d.primaryImpact}</span>}
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border bg-background px-4 py-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-1 text-xs font-bold uppercase text-[#6366F1]">How to fix</div>
            <p className="text-sm text-foreground">{d.oneLineFix || "—"}</p>
            {d.detailedFix && <p className="mt-2 text-xs text-muted-foreground">{d.detailedFix}</p>}
          </div>

          {d.estimatedImpact && <p className="text-xs text-muted-foreground">Estimated impact: {d.estimatedImpact}</p>}

          {Array.isArray(d.evidence) && d.evidence.length > 0 && (
            <div className="text-xs">
              <div className="mb-1 font-semibold text-muted-foreground">Evidence:</div>
              <ul className="space-y-1">
                {d.evidence.map((ev, j) => {
                  const isUrl = typeof ev === "string" && (ev.startsWith("http://") || ev.startsWith("https://"));
                  return (
                    <li key={j} className="text-muted-foreground">
                      {isUrl ? (
                        <a href={ev} target="_blank" rel="noreferrer" className="break-all text-[#6366F1] hover:underline">
                          {ev}
                        </a>
                      ) : (
                        <span className="break-all">{ev}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {d.lighthouseAuditId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Audit ID:</span>
              <code className="rounded border border-border bg-background px-2 py-0.5 font-mono text-foreground">
                {d.lighthouseAuditId}
              </code>
            </div>
          )}

          {Array.isArray(d.references?.nodes) &&
            d.references.nodes.length > 0 &&
            typeof d.references.nodes[0] === "object" && (
              <div>
                <div className="mb-2 text-xs font-semibold text-muted-foreground">Details</div>
                <LhDetailsTable items={d.references.nodes} />
              </div>
            )}
        </div>
      )}
    </div>
  );
}
