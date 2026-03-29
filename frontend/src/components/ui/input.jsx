import React from "react";

function Input({ className = "", type = "text", ...props }) {
  return (
    <input
      type={type}
      className={`h-9 w-full rounded-md border px-3 py-1 text-sm outline-none 
      placeholder-gray-400 
      focus:border-blue-500 focus:ring-2 focus:ring-blue-200
      disabled:opacity-50 disabled:cursor-not-allowed 
      ${className}`}
      {...props}
    />
  );
}

export default Input;
