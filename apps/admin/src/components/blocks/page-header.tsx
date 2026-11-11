import type { ReactNode } from "react";

import { cn } from "cn";

/** Props for the shared app-page heading. */
export interface PageHeaderProps {
  /** Page name, rendered as h1. Use once per page. */
  title: string;
  /** Optional supporting sentence below the title. */
  description?: string;
  /** Route-owned controls in a wrapping action row. */
  actions?: ReactNode;
  /** Additional layout classes on the outer row. */
  className?: string;
}

/** Responsive app-page h1, description and actions; owns no data or navigation. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex min-w-0 shrink-0 flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 flex-1 basis-64">
        <h1 className="text-2xl leading-tight font-medium tracking-tight wrap-break-word">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm wrap-break-word">{description}</p>}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
