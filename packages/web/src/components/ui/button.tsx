import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "default";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-brand-300/50";
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      // CTA principal con brand
      primary: "bg-brand-400 text-slate-900 hover:bg-brand-300",
      // Primario oscuro por defecto
      secondary:
        "bg-white/10 text-slate-200 border border-card-stroke hover:bg-white/15",
      // Mantener compat con código previo que usaba 'default'
      default:
        "bg-white/10 text-slate-200 border border-card-stroke hover:bg-white/15",
      // Contorno elegante
      outline: "btn-outline-dark hover:border-brand-400/70",
      // Fantasma minimal
      ghost: "text-slate-300 hover:bg-brand-300/10",
    };
    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-9 px-4 text-sm",
      lg: "h-10 px-5 text-base",
    } as const;
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
