import { jsx as _jsx } from "react/jsx-runtime";
export const Badge = ({ className = "", variant = "default", ...props }) => {
    const base = "inline-flex items-center rounded-full text-xs font-medium";
    const variants = {
        default: "badge-muted px-2 py-0.5",
        outline: "btn-outline-dark hover:border-brand-400/70 px-2 py-0.5",
    };
    return (_jsx("span", { className: `${base} ${variants[variant]} ${className}`, ...props }));
};
