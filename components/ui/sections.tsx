import { cn } from "cn";
import type { ComponentPropsWithRef } from "react";

export function Sections({ children, className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-10", className)} {...props}>
      {children}
    </div>
  );
}
