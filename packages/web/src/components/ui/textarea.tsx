import * as React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", rows = 3, ...props }, ref) => {
    const base =
  "w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors input-dark";
    return <textarea ref={ref} rows={rows} className={`${base} ${className}`} {...props} />;
  }
);

Textarea.displayName = "Textarea";
