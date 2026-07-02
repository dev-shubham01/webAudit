import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import LhDetailsTable from "./LhDetailsTable.jsx";

function severityBg(s) {
  if (!s) return "bg-[#334155] text-[#E2E8F0]";
  const sl = s.toLowerCase();
  if (sl === "critical") return "bg-red-500/20 text-red-300";
  if (sl === "high") return "bg-orange-500/20 text-orange-300";
  if (sl === "medium") return "bg-yellow-500/20 text-yellow-300";
  return "bg-[#334155]/60 text-[#94A3B8]";
}

export default function DiagnosticItem({ d }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-[#334155]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 bg-[#1E293B] px-4 py-3 text-left transition-colors hover:bg-[#263449]"
      >
        <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${severityBg(d.severity)}`}>
          {d.severity || "Medium"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[#E2E8F0]">{d.warning || d.helpText || "—"}</div>
          {d.oneLineFix && <div className="mt-0.5 truncate text-xs text-[#6366F1]">Fix: {d.oneLineFix}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {d.primaryImpact && <span className="hidden text-xs text-[#94A3B8] sm:block">{d.primaryImpact}</span>}
          {open ? <ChevronUp className="h-3.5 w-3.5 text-[#94A3B8]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />}
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-[#334155] bg-[#0F172A] px-4 py-4">
          <div className="rounded-lg border border-[#334155] bg-[#0F172A] p-3">
            <div className="mb-1 text-xs font-bold uppercase text-[#6366F1]">How to fix</div>
            <p className="text-sm text-[#E2E8F0]">{d.oneLineFix || "—"}</p>
            {d.detailedFix && <p className="mt-2 text-xs text-[#94A3B8]">{d.detailedFix}</p>}
          </div>

          {d.estimatedImpact && <p className="text-xs text-[#94A3B8]">Estimated impact: {d.estimatedImpact}</p>}

          {Array.isArray(d.evidence) && d.evidence.length > 0 && (
            <div className="text-xs">
              <div className="mb-1 font-semibold text-[#94A3B8]">Evidence:</div>
              <ul className="space-y-1">
                {d.evidence.map((ev, j) => {
                  const isUrl = typeof ev === "string" && (ev.startsWith("http://") || ev.startsWith("https://"));
                  return (
                    <li key={j} className="text-[#94A3B8]">
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
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <span>Audit ID:</span>
              <code className="rounded border border-[#334155] bg-[#0F172A] px-2 py-0.5 font-mono text-[#E2E8F0]">
                {d.lighthouseAuditId}
              </code>
            </div>
          )}

          {Array.isArray(d.references?.nodes) &&
            d.references.nodes.length > 0 &&
            typeof d.references.nodes[0] === "object" && (
              <div>
                <div className="mb-2 text-xs font-semibold text-[#94A3B8]">Details</div>
                <LhDetailsTable items={d.references.nodes} />
              </div>
            )}
        </div>
      )}
    </div>
  );
}
