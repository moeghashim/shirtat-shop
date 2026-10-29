"use client";

import { MessageCircle } from "lucide-react";
import { useRef, useState } from "react";

import { useT } from "@/lib/i18n/client";

import { AgentPanel } from "./client";

export function AgentButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // The panel and chat client load on the first tap, so they never cost the page load.
  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1.5 px-2 py-1"
        onClick={() => {
          setMounted(true);
          setOpen((previous) => !previous);
        }}
        type="button"
      >
        <MessageCircle className="size-4 text-primary" />
        <span className="sr-only">{t("Open support chat")}</span>
      </button>
      {mounted && <AgentPanel onOpenChange={setOpen} open={open} triggerRef={triggerRef} />}
    </>
  );
}
