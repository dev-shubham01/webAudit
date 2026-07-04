import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import DiagnosticItem from "./DiagnosticItem.jsx";

export default function DiagnosticGroup({ group, items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  const maxSeverity = useMemo(() => {
    const order = ["critical", "high", "medium", "low"];
    const all = items.map((d) => (d.severity || "low").toLowerCase());
    return order.find((s) => all.includes(s)) || "low";
  }, [items]);

  const severityDot = (s) => {
    if (s === "critical" || s === "high") return "bg-red-500";
    if (s === "medium") return "bg-yellow-500";
    return "bg-border";
  };

  return (
    <div className={`overflow-hidden rounded-xl border opacity-80 ${group.border}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 bg-card px-5 py-4 text-left transition-colors hover:bg-[#263449]"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${severityDot(maxSeverity)}`} />
        <span className={`text-sm font-semibold ${group.color}`}>{group.label}</span>
        <span className="rounded-full bg-border/60 px-2 py-0.5 text-xs text-muted-foreground">
          {items.length} issue{items.length !== 1 ? "s" : ""}
        </span>
        <div className="flex-1" />
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="space-y-2 divide-y divide-border bg-background p-3">
          {items.map((d, i) => (
            <DiagnosticItem key={i} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
