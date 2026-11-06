"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { T } from "@/components/i18n/t";

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-60 bg-black/30 transition-opacity ease-in-out data-open:duration-500 data-closed:duration-300 data-starting-style:opacity-0 data-ending-style:opacity-0 data-[dim=false]:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  closeButton = true,
  keepMounted = false,
  overlay = true,
  presentation = "drawer",
  side = "right",
  ...props
}: SheetPrimitive.Popup.Props & {
  closeButton?: boolean;
  keepMounted?: boolean;
  overlay?: boolean;
  presentation?: "drawer" | "floating";
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal keepMounted={keepMounted}>
      {/* Base UI's own modal backdrop has no z-index, so z-indexed page chrome such as the sticky header stays clickable; without a dimmed overlay, this transparent one takes the click-away. */}
      <SheetOverlay data-dim={overlay} />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-60 flex flex-col transition ease-in-out motion-reduce:transition-none data-open:duration-300 data-closed:duration-200",
          presentation === "drawer" && "bg-card gap-5 shadow-lg",
          presentation === "drawer" &&
            side === "right" &&
            "inset-y-0 right-0 h-full w-[calc(100%-2.5rem)] max-w-md border-l data-starting-style:translate-x-full data-ending-style:translate-x-full",
          presentation === "drawer" &&
            side === "left" &&
            "inset-y-0 left-0 h-full w-[calc(100%-2.5rem)] max-w-md border-r data-starting-style:-translate-x-full data-ending-style:-translate-x-full",
          presentation === "drawer" &&
            side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-starting-style:-translate-y-full data-ending-style:-translate-y-full",
          presentation === "drawer" &&
            side === "bottom" &&
            "inset-x-0 bottom-0 h-auto rounded-t-3xl border-t data-starting-style:translate-y-full data-ending-style:translate-y-full",
          presentation === "floating" &&
            "bg-[#f6f1e8] text-foreground shadow-[0_18px_50px_rgba(23,23,23,0.16)] data-starting-style:translate-y-2 data-starting-style:opacity-0 data-ending-style:opacity-0 max-md:inset-x-0 max-md:top-[max(0.75rem,env(safe-area-inset-top))] max-md:bottom-[calc(env(safe-area-inset-bottom)+var(--agent-keyboard,0px))] max-md:h-auto max-md:w-full max-md:rounded-t-[1.75rem] md:end-5 md:bottom-[calc(1.25rem+var(--agent-keyboard,0px))] md:h-[min(42rem,calc(100dvh-2.5rem-var(--agent-keyboard,0px)))] md:w-[30rem] md:max-w-[calc(100vw-2.5rem)] md:rounded-[1.75rem]",
          className,
        )}
        {...props}
      >
        {children}
        {closeButton && (
          <SheetPrimitive.Close className="ring-offset-background focus-visible:ring-ring absolute top-3 end-2.5 flex size-10 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none">
            <XIcon className="size-5" />
            <span className="sr-only">
              <T k="Close" />
            </span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
