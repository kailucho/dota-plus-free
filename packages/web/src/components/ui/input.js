import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
export const Input = React.forwardRef(({ className = "", uiSize = "md", ...props }, ref) => {
    const base = "w-full rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand-300/40 focus:border-brand-400/60 transition-colors input-dark";
    const sizes = {
        sm: "py-1.5 text-sm",
        md: "py-2 text-sm",
        lg: "py-2.5 text-base",
    };
    return (_jsx("input", { ref: ref, className: `${base} ${sizes[uiSize]} ${className}`, ...props }));
});
Input.displayName = "Input";
