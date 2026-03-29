import React from "react";

function Button({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) {
  let base =
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

  let variantClass = "";
  if (variant === "default") {
    variantClass =
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:hover:bg-blue-600";
  } else if (variant === "destructive") {
    variantClass =
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:hover:bg-red-600";
  } else if (variant === "outline") {
    variantClass =
      "cursor-pointer border bg-background text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:active:bg-input/40 disabled:hover:bg-background dark:disabled:hover:bg-input/30";
  } else if (variant === "secondary") {
    variantClass =
      "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 disabled:hover:bg-gray-200";
  } else if (variant === "ghost") {
    variantClass =
      "hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-[#1E293B] dark:active:bg-[#334155] disabled:hover:bg-transparent";
  } else if (variant === "link") {
    variantClass =
      "text-blue-600 underline-offset-4 hover:underline disabled:hover:no-underline";
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
