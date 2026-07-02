import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Zap, Image, Code2, Search, Shield, Clock } from "lucide-react";

const ICON_MAP = { Zap, Image, Code2, Search, Shield, Clock };

function WinIcon({ iconKey }) {
  const Icon = ICON_MAP[iconKey] || Zap;
  return <Icon className="h-4 w-4" />;
}

export default function QuickWinCard({ win, passed }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all duration-200 ${
        passed ? "border-green-700/40 bg-green-500/5" : "border-amber-700/40 bg-amber-500/5"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left transition-opacity hover:opacity-90"
      >
        <div
          className={`shrink-0 rounded-lg p-2 ${
            passed ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
          }`}
        >
          <WinIcon iconKey={win.iconKey} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#E2E8F0]">{win.title}</div>
          <div className={`mt-0.5 text-xs ${passed ? "text-green-400" : "text-amber-400"}`}>
            {passed ? "Passing" : "Needs attention"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {passed ? <CheckCircle className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-amber-400" />}
          {open ? <ChevronUp className="h-4 w-4 text-[#94A3B8]" /> : <ChevronDown className="h-4 w-4 text-[#94A3B8]" />}
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-[#334155] bg-[#0F172A] px-4 py-4">
          <div>
            <div className="mb-1 text-xs font-semibold text-[#94A3B8]">Why it matters</div>
            <p className="text-sm text-[#E2E8F0]">{win.why}</p>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-[#94A3B8]">How to fix</div>
            <p className="text-sm text-[#E2E8F0]">{win.how}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8]">Estimated impact:</span>
            <span className="text-xs font-semibold text-[#6366F1]">{win.impact}</span>
          </div>
        </div>
      )}
    </div>
  );
}
