import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
export const Select = React.forwardRef(({ className = "", size = "md", children, ...props }, ref) => {
    const base = "w-full rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300/40 focus:border-brand-400/60 transition-colors input-dark bg-transparent";
    const sizes = {
        sm: "text-sm py-1.5",
        md: "text-sm py-2",
        lg: "text-base py-2.5",
    };
    return (_jsx("select", { ref: ref, className: `${base} ${sizes[size]} ${className}`, ...props, children: children }));
});
Select.displayName = "Select";
