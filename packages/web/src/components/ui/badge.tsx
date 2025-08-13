import * as React from "react";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline";
};

export const Badge = ({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) => {
  const base = "inline-flex items-center rounded-full text-xs font-medium";
  const variants = {
    default: "badge-muted px-2 py-0.5",
    outline: "btn-outline-dark hover:border-brand-400/70 px-2 py-0.5",
  } as const;
  return (
    <span className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
};
