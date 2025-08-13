import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  uiSize?: "sm" | "md" | "lg";
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", uiSize = "md", ...props }, ref) => {
    const base =
      "w-full rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand-300/40 focus:border-brand-400/60 transition-colors input-dark";
    const sizes: Record<NonNullable<InputProps["uiSize"]>, string> = {
      sm: "py-1.5 text-sm",
      md: "py-2 text-sm",
      lg: "py-2.5 text-base",
    };
    return (
      <input
        ref={ref}
        className={`${base} ${sizes[uiSize]} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
