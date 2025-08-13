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
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={toggle}
          role="button"
          aria-expanded={!isCollapsed}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
        >
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {actionsRight}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggle}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Mostrar" : "Minimizar"}
          >
            {isCollapsed ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export default CollapsibleCard;

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 111.04 1.08l-4.243 3.84a.75.75 0 01-1.041 0L5.25 8.31a.75.75 0 01-.02-1.1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M14.77 12.79a.75.75 0 01-1.06-.02L10 9.415l-3.71 3.354a.75.75 0 11-1.04-1.08l4.243-3.84a.75.75 0 011.041 0l4.217 3.84c.29.263.297.71.02 1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
