import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

export type CollapsibleCardProps = {
  title: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean; // controlled
  onToggle?: (next: boolean) => void;
  actionsRight?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function CollapsibleCard({
  title,
  defaultCollapsed = false,
  collapsed: controlled,
  onToggle,
  actionsRight,
  children,
  className = "",
}: CollapsibleCardProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultCollapsed);
  const isControlled = controlled != null;
  const isCollapsed = isControlled ? !!controlled : uncontrolled;

  function toggle() {
    if (isControlled) onToggle?.(!isCollapsed);
    else setUncontrolled((v) => !v);
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {actionsRight}
          <Button type="button" variant="outline" size="sm" onClick={toggle}>
            {isCollapsed ? "Mostrar" : "Minimizar"}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export default CollapsibleCard;
