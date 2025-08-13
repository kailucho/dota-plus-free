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
    return (_jsxs(Card, { className: className, children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx(CardTitle, { children: title }) }), _jsxs("div", { className: "flex items-center gap-2", children: [actionsRight, _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: toggle, children: isCollapsed ? "Mostrar" : "Minimizar" })] })] }), !isCollapsed && _jsx(CardContent, { children: children })] }));
}
export default CollapsibleCard;
