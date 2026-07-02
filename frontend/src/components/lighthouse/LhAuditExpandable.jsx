import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LhDetailsTable from "./LhDetailsTable.jsx";

export default function LhAuditExpandable({ audit }) {
  const [open, setOpen] = useState(false);
  const items = audit?.details?.items;
  const headings = audit?.details?.headings;
  const title = audit.title || audit.id;
  const hasTable = Array.isArray(items) && items.length > 0;

  return (
    <li className="overflow-hidden rounded-xl border border-[#334155] bg-[#1E293B]/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#1E293B]"
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[#E2E8F0]">{title}</div>
          <div className="mt-0.5 font-mono text-[10px] text-[#94A3B8]">{audit.id}</div>
          {audit.displayValue && <div className="mt-1 font-mono text-xs text-amber-300">{audit.displayValue}</div>}
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-[#334155] px-3 pb-3 pt-1">
          {audit.description && (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#94A3B8]">{audit.description}</p>
          )}
          {audit.helpText && <p className="text-xs text-[#94A3B8]">{audit.helpText}</p>}
          {hasTable && <LhDetailsTable headings={headings} items={items} />}
          {!hasTable && <p className="text-xs text-[#94A3B8]">No detail rows for this audit.</p>}
        </div>
      )}
    </li>
  );
}
