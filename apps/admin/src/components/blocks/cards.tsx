import { type ComponentProps, type ReactNode, useId } from "react";

import { cn } from "cn";

import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card";

/** Card surface using the shared compact or standard spacing; compose with UI card slots. */
export type DashboardCardProps = ComponentProps<typeof Card> & {
  /** Compact uses 12px spacing; standard follows responsive card tokens. Defaults to standard. */
  density?: "compact" | "standard";
};

/** Shared dashboard card. All native Card props, children and accessible names pass through. */
export function DashboardCard({ density = "standard", className, ...props }: DashboardCardProps) {
  return <Card {...props} size={density === "compact" ? "sm" : "default"} className={cn("min-w-0", className)} />;
}

/** Props for a card-level semantic heading. */
export interface SectionHeaderProps {
  /** Visible section heading. */
  title: ReactNode;
  /** Supporting content below the heading. */
  description?: ReactNode;
  /** Route-owned controls, wrapping beside the heading. */
  actions?: ReactNode;
  /** Heading hierarchy; defaults to h2. */
  level?: 2 | 3;
  /** Heading ID for aria-labelledby and fragment links. */
  id?: string;
}

/** Wrapping h2/h3 header for DashboardCard, with optional description and actions. */
export function SectionHeader({ title, description, actions, level = 2, id }: SectionHeaderProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <CardHeader className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 basis-40">
        <Heading id={id} className="text-base font-medium tracking-tight wrap-break-word">
          {title}
        </Heading>
        {description && <div className="text-muted-foreground mt-1 text-sm">{description}</div>}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </CardHeader>
  );
}

/** Props for an accessibly labelled metric card. */
export interface StatCardProps {
  /** Heading hierarchy; defaults to h2. */
  level?: 2 | 3;
  /** Accessible metric name and visible heading. */
  label: string;
  /** Route-formatted metric; units and locale belong to the caller. */
  value: ReactNode;
  /** Supporting explanation below the value. */
  help?: ReactNode;
  /** Text or indicator alongside the value; pair color with a label. */
  trend?: ReactNode;
  /** Route-owned controls in the card header. */
  actions?: ReactNode;
  /** Optional decorative or accessibly named icon. */
  icon?: ReactNode;
  /** Card spacing; defaults to standard. */
  density?: "compact" | "standard";
  /** Additional layout classes. */
  className?: string;
}

/** Metric card with tabular values and optional help, trend, icon and action slots. */
export function StatCard({
  label,
  value,
  help,
  trend,
  actions,
  icon,
  density = "standard",
  level = 2,
  className,
}: StatCardProps) {
  const id = useId();
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <DashboardCard density={density} className={className} role="group" aria-labelledby={id}>
      <CardHeader>
        {icon}
        <Heading id={id} className="text-muted-foreground text-sm font-medium wrap-break-word">
          {label}
        </Heading>
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 text-2xl leading-tight font-medium tracking-tight wrap-break-word tabular-nums xl:text-3xl">
            {value}
          </div>
          {trend}
        </div>
        {help && <div className="text-muted-foreground text-sm">{help}</div>}
      </CardContent>
    </DashboardCard>
  );
}
