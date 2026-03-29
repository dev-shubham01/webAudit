import { CheckCircle2, XCircle } from "lucide-react";

export default function SeoRow({ label, ok, okText, badText, detail }) {
  const statusEmoji = ok ? "✅" : "❌";
  const statusText = ok ? okText : badText;

  return (
    <div className="flex gap-3 rounded-xl border border-[#334155] bg-[#0F172A]/50 p-4 transition-all duration-200 hover:bg-[#0F172A]/70">
      <div className="shrink-0 pt-0.5">
        {ok ? (
          <CheckCircle2 className="h-5 w-5 text-[#22C55E]" aria-hidden />
        ) : (
          <XCircle className="h-5 w-5 text-[#EF4444]" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-[#E2E8F0]">{label}</span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              ok
                ? "bg-[#22C55E]/15 text-[#86EFAC]"
                : "bg-[#EF4444]/15 text-[#FCA5A5]"
            }`}
          >
            <span className="mr-1" aria-hidden>
              {statusEmoji}
            </span>
            {statusText}
          </span>
        </div>
        {detail ? (
          <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
