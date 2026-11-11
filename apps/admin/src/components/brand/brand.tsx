import type { ComponentProps } from "react";

import { cn } from "cn";

/** Original paired-board silhouette: a solid upright and an open board read as “10”. */
export function BrandMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path fillRule="evenodd" d="M4 5h4v14H4V5Zm7 0h9v14h-9V5Zm3 3v8h3V8h-3Z" />
    </svg>
  );
}

export function BrandWordmark({ className, ...props }: ComponentProps<"span">) {
  return (
    <span className={cn("font-semibold tracking-tight", className)} {...props}>
      Shirtat
    </span>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className="size-6" />
      <BrandWordmark />
    </span>
  );
}
