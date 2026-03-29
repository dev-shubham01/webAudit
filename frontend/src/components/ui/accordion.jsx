import React, { createContext, useContext, useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "./utils";

const AccordionContext = createContext(null);
const AccordionItemContext = createContext(null);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error("AccordionItem must be used inside Accordion");
  }
  return ctx;
}

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) {
    throw new Error("AccordionTrigger and AccordionContent must be used inside AccordionItem");
  }
  return ctx;
}

function Accordion({
  type = "single",
  collapsible = false,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}) {
  const isSingle = type === "single";
  const isControlled = controlledValue !== undefined;

  const [uncontrolled, setUncontrolled] = useState(() => {
    if (defaultValue !== undefined) return defaultValue;
    return isSingle ? undefined : [];
  });

  const rawValue = isControlled ? controlledValue : uncontrolled;

  const setValue = (next) => {
    if (!isControlled) {
      setUncontrolled(next);
    }
    onValueChange?.(next);
  };

  const api = {
    isSingle,
    collapsible,
    isOpen(itemValue) {
      if (isSingle) {
        return rawValue === itemValue;
      }
      const list = Array.isArray(rawValue) ? rawValue : [];
      return list.includes(itemValue);
    },
    toggle(itemValue) {
      if (isSingle) {
        if (rawValue === itemValue) {
          if (collapsible) setValue(undefined);
        } else {
          setValue(itemValue);
        }
        return;
      }
      const list = Array.isArray(rawValue) ? rawValue : [];
      if (list.includes(itemValue)) {
        setValue(list.filter((v) => v !== itemValue));
      } else {
        setValue([...list, itemValue]);
      }
    },
  };

  return (
    <AccordionContext.Provider value={api}>
      <div data-slot="accordion" className={cn(className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ className, value, children, ...props }) {
  const accordion = useAccordionContext();
  const baseId = useId();
  const ids = useMemo(
    () => ({
      value,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
    }),
    [baseId, value],
  );
  const open = accordion.isOpen(value);

  return (
    <AccordionItemContext.Provider value={ids}>
      <div
        data-slot="accordion-item"
        data-state={open ? "open" : "closed"}
        className={cn("border-b last:border-b-0", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

function AccordionTrigger({ className, children, onClick, disabled, ...props }) {
  const accordion = useAccordionContext();
  const item = useAccordionItemContext();
  const open = accordion.isOpen(item.value);

  return (
    <div className="flex">
      <button
        type="button"
        id={item.triggerId}
        data-slot="accordion-trigger"
        data-state={open ? "open" : "closed"}
        aria-expanded={open}
        aria-controls={item.contentId}
        disabled={disabled}
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented && !disabled) {
            accordion.toggle(item.value);
          }
        }}
        {...props}
      >
        {children}
        <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </button>
    </div>
  );
}

function AccordionContent({ className, children, ...props }) {
  const accordion = useAccordionContext();
  const item = useAccordionItemContext();
  const open = accordion.isOpen(item.value);

  return (
    <div
      data-slot="accordion-content"
      data-state={open ? "open" : "closed"}
      id={item.contentId}
      role="region"
      aria-labelledby={item.triggerId}
      hidden={!open}
      className="overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{open ? children : null}</div>
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
