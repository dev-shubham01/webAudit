import React from "react";

import { cn } from "./utils";
import { getBadgeVariant } from "../../utils/badges.js";

const baseClasses =
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden";

const variantClasses = {
  default:
    "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
  secondary:
    "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
  destructive:
    "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
  outline:
    "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
};

// Value-driven semantic variants (status codes, priority, severity) — ported from
// the reference project's Badge.jsx so 200=green, 301/302=yellow, Critical/High/etc.
// each get a distinct color instead of the generic shadcn variants above.
const SEMANTIC_VARIANTS = new Set(["critical", "high", "medium", "low", "info", "success"]);
const semanticBaseClasses = "inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase";
const semanticVariantClasses = {
  critical: "bg-red-500 text-white",
  high: "bg-red-500/20 text-red-400 border border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  low: "bg-slate-500/20 text-muted-foreground border border-slate-500/30",
  info: "bg-slate-500/20 text-muted-foreground border border-slate-500/30",
  success: "bg-green-500/20 text-green-400 border border-green-500/30",
};

function badgeVariants({ variant } = {}) {
  const v = variant ?? "default";
  return cn(baseClasses, variantClasses[v] || variantClasses.default);
}

function Badge({ className, variant, value, label, children, ...props }) {
  const resolvedVariant = variant || (value !== undefined ? getBadgeVariant(value) : undefined);

  if (resolvedVariant && SEMANTIC_VARIANTS.has(resolvedVariant)) {
    const display = label != null ? label : value != null && value !== "" ? String(value) : children ?? "—";
    return (
      <span
        data-slot="badge"
        className={cn(semanticBaseClasses, semanticVariantClasses[resolvedVariant], className)}
        {...props}
      >
        {display}
      </span>
    );
  }

  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
