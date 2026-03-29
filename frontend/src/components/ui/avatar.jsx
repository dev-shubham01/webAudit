import React, { createContext, useContext, useLayoutEffect, useState } from "react";

import { cn } from "./utils";

const AvatarContext = createContext(null);

function useAvatarContext() {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error("AvatarImage and AvatarFallback must be used inside Avatar");
  }
  return ctx;
}

function Avatar({ className, children, ...props }) {
  const [status, setStatus] = useState("absent");

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <div
        data-slot="avatar"
        className={cn(
          "relative flex size-10 shrink-0 overflow-hidden rounded-full",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
}

function AvatarImage({ className, src, alt = "", ...props }) {
  const { status, setStatus } = useAvatarContext();

  useLayoutEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    setStatus("loading");
  }, [src, setStatus]);

  if (!src) {
    return null;
  }

  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      className={cn(
        "aspect-square size-full object-cover transition-opacity duration-200",
        status === "loaded"
          ? "relative z-10 opacity-100"
          : "pointer-events-none absolute inset-0 z-[1] opacity-0",
        className,
      )}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
      {...props}
    />
  );
}

function AvatarFallback({ className, children, ...props }) {
  const { status } = useAvatarContext();

  if (status === "loaded") {
    return null;
  }

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted absolute inset-0 z-0 flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
