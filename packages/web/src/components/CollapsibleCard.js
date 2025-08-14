import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
export function CollapsibleCard({ title, defaultCollapsed = false, collapsed: controlled, onToggle, actionsRight, children, className = "", }) {
    const [uncontrolled, setUncontrolled] = React.useState(defaultCollapsed);
    const isControlled = controlled != null;
    const isCollapsed = isControlled ? !!controlled : uncontrolled;
    function toggle() {
        if (isControlled)
            onToggle?.(!isCollapsed);
        else
            setUncontrolled((v) => !v);
    }
    return (_jsxs(Card, { className: className, children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-2 cursor-pointer select-none", onClick: toggle, role: "button", "aria-expanded": !isCollapsed, tabIndex: 0, onKeyDown: (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggle();
                            }
                        }, children: _jsx(CardTitle, { children: title }) }), _jsxs("div", { className: "flex items-center gap-2", children: [actionsRight, _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: toggle, "aria-expanded": !isCollapsed, "aria-label": isCollapsed ? "Mostrar" : "Minimizar", children: isCollapsed ? (_jsx(ChevronDownIcon, { className: "h-4 w-4" })) : (_jsx(ChevronUpIcon, { className: "h-4 w-4" })) })] })] }), !isCollapsed && _jsx(CardContent, { children: children })] }));
}
export default CollapsibleCard;
function ChevronDownIcon(props) {
    return (_jsx("svg", { viewBox: "0 0 20 20", fill: "currentColor", ...props, children: _jsx("path", { fillRule: "evenodd", d: "M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 111.04 1.08l-4.243 3.84a.75.75 0 01-1.041 0L5.25 8.31a.75.75 0 01-.02-1.1z", clipRule: "evenodd" }) }));
}
function ChevronUpIcon(props) {
    return (_jsx("svg", { viewBox: "0 0 20 20", fill: "currentColor", ...props, children: _jsx("path", { fillRule: "evenodd", d: "M14.77 12.79a.75.75 0 01-1.06-.02L10 9.415l-3.71 3.354a.75.75 0 11-1.04-1.08l4.243-3.84a.75.75 0 011.041 0l4.217 3.84c.29.263.297.71.02 1.06z", clipRule: "evenodd" }) }));
}
