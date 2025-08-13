import { jsx as _jsx } from "react/jsx-runtime";
export const Card = ({ className = "", ...props }) => (_jsx("div", { className: `rounded-2xl border border-card-stroke bg-card shadow-card-elev ${className}`, ...props }));
export const CardHeader = ({ className = "", ...props }) => (_jsx("div", { className: `p-4 sm:p-5 border-b border-card-stroke/70 ${className}`, ...props }));
export const CardTitle = ({ className = "", ...props }) => (_jsx("h3", { className: `text-base font-semibold text-slate-100 ${className}`, ...props }));
export const CardContent = ({ className = "", ...props }) => (_jsx("div", { className: `p-4 sm:p-5 ${className}`, ...props }));
