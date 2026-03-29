import React from "react";

function Button({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) {
  let base =
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all";

  let variantClass = "";
  if (variant === "default") {
    variantClass = "bg-blue-600 text-white hover:bg-blue-700";
  } else if (variant === "destructive") {
    variantClass = "bg-red-600 text-white hover:bg-red-700";
  } else if (variant === "outline") {
    variantClass =
      "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer";
  } else if (variant === "secondary") {
    variantClass = "bg-gray-200 hover:bg-gray-300";
  } else if (variant === "ghost") {
    variantClass = "hover:bg-gray-100";
  } else if (variant === "link") {
    variantClass = "text-blue-600 underline";
  }

  let sizeClass = "";
  if (size === "default") {
    sizeClass = "h-9 px-4";
  } else if (size === "sm") {
    sizeClass = "h-8 px-3";
  } else if (size === "lg") {
    sizeClass = "h-10 px-6";
  } else if (size === "icon") {
    sizeClass = "h-9 w-9";
  }

  return (
    <button
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
