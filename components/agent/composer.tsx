"use client";

import { ArrowUpIcon, Loader2Icon, MicIcon, SquareIcon } from "lucide-react";
import type { KeyboardEvent } from "react";

import { useT } from "@/lib/i18n/client";

type AgentStatus = "error" | "ready" | "resuming" | "streaming" | "submitted";

interface AgentComposerProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onStop: () => void;
  onSubmit: (text: string) => void;
  onVoice?: () => void;
  placeholder?: string;
  status: AgentStatus;
  value: string;
  voice?: "idle" | "listening" | "speaking" | "connecting";
}

export function AgentComposer({
  disabled = false,
  onChange,
  onStop,
  onSubmit,
  onVoice,
  placeholder,
  status,
  value,
  voice,
}: AgentComposerProps) {
  const t = useT();
  const isBusy = status === "submitted" || status === "streaming";
  const submit = () => {
    if (disabled || status === "resuming") return;
    if (isBusy) {
      onStop();
      return;
    }
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };
  let icon = <ArrowUpIcon className="size-4" />;
  if (status === "submitted") icon = <Loader2Icon className="size-4 animate-spin" />;
  else if (status === "streaming") icon = <SquareIcon className="size-4" />;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="px-4 pt-2 pb-4"
    >
      <div className="flex items-end gap-2 rounded-[1.4rem] bg-white px-2 py-2 shadow-[0_1px_0_rgba(23,23,23,0.04)]">
        {voice ? (
          <button
            aria-label={voice === "idle" ? t("Start voice") : t("Stop voice")}
            aria-pressed={voice !== "idle"}
            className="mb-0.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#efe6d2] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[voice=listening]:animate-pulse data-[voice=listening]:bg-foreground data-[voice=listening]:text-background data-[voice=speaking]:bg-foreground data-[voice=speaking]:text-background"
            data-voice={voice}
            onClick={onVoice}
            type="button"
          >
            <MicIcon className="size-4" />
          </button>
        ) : null}
        <textarea
          aria-label={t("Message Shirtat Assistant")}
          className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          value={value}
        />
        <button
          aria-label={isBusy ? t("Stop") : t("Send")}
          className="mb-0.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || status === "resuming" || (!value.trim() && !isBusy)}
          type="submit"
        >
          {icon}
        </button>
      </div>
    </form>
  );
}
