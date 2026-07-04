import { Flame, AlertTriangle, AlertCircle, Info } from "lucide-react";

export const SEVERITY_ORDER = ["Critical", "High", "Medium", "Low", "Info"];

export const SEVERITY_CONFIG = {
  Critical: {
    icon: Flame,
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    ring: "ring-1 ring-red-500/20 border-red-900/30",
    rowBorder: "border-l-red-500",
    recBg: "bg-red-500/5 border-red-500/20",
    order: 0,
    chartColor: "#EF4444",
  },
  High: {
    icon: AlertTriangle,
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    ring: "ring-1 ring-orange-500/20 border-orange-900/30",
    rowBorder: "border-l-orange-500",
    recBg: "bg-orange-500/5 border-orange-500/20",
    order: 1,
    chartColor: "#F97316",
  },
  Medium: {
    icon: AlertCircle,
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    ring: "",
    rowBorder: "border-l-yellow-500",
    recBg: "bg-yellow-500/5 border-yellow-500/20",
    order: 2,
    chartColor: "#EAB308",
  },
  Low: {
    icon: Info,
    text: "text-muted-foreground",
    bg: "bg-border/20",
    border: "border-border/40",
    ring: "",
    rowBorder: "border-l-neutral-500",
    recBg: "bg-border/30 border-border/30",
    order: 3,
    chartColor: "#64748B",
  },
  Info: {
    icon: Info,
    text: "text-muted-foreground",
    bg: "bg-border/20",
    border: "border-border/30",
    ring: "",
    rowBorder: "border-l-neutral-600",
    recBg: "bg-border/20 border-border/30",
    order: 4,
    chartColor: "#475569",
  },
};

export function toTitleCase(str) {
  return (str || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
