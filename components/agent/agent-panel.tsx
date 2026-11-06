"use client";

import { openConversationInputs, useEveAgent } from "eve/react";
import { MessageCircleIcon, Trash2Icon, XIcon } from "lucide-react";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { setAgentCartStatus, useAgentCartPending } from "@/lib/agent/cart/client";
import { readStoredChat, writeStoredChat } from "@/lib/agent/chat/client";
import { useT } from "@/lib/i18n/client";

import { CapturedStream } from "./captured-stream";
import { AgentCartBridge } from "./cart-bridge";
import { ChatMessage } from "./chat-message";
import { AgentComposer } from "./composer";
import { AgentFixtureScene, readAgentFixture } from "./fixture";
import { AgentCartSummary } from "./shopping-results";
import { AgentThinking } from "./thinking";

const WELCOME_SUGGESTIONS = [
  ["Gifts", "Help me choose a gift"],
  ["Arabic designs", "Show me Arabic designs"],
  ["Styles", "Which calligraphy styles do you have?"],
] as const;

const CANCEL_TIMEOUT_MS = 10_000;

function prepareAgentSession() {
  return fetch("/api/agent/session", {
    credentials: "same-origin",
    method: "POST",
    redirect: "error",
  }).then((response) => {
    if (!response.ok) throw new Error("Could not prepare the assistant. Please try again.");
  });
}

export interface AgentPanelProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
}

export function AgentPanel({ onOpenChange, open, triggerRef }: AgentPanelProps) {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const [fixture] = useState(() => readAgentFixture(window.location.search));
  const [fixtureNote, setFixtureNote] = useState<string | null>(null);
  const [fixtureBusy, setFixtureBusy] = useState(false);
  const [stored] = useState(readStoredChat);
  // Idle stored sessions replay on first open; an interrupted turn resumes at once so its cart writes reconcile.
  const [resumePending, setResumePending] = useState(Boolean(stored.session && !stored.turnActive));
  const [input, setInput] = useState(stored.input);
  const snapshot = useRef(stored);
  const [clearing, setClearing] = useState(false);
  const clearAttempt = useRef<{
    reject: (error: Error) => void;
    resolve: () => void;
  } | null>(null);
  const cartPending = useAgentCartPending();
  const [controlError, setControlError] = useState<string | null>(null);
  const [pendingSend, setPendingSend] = useState(false);
  const sessionPrep = useRef<Promise<void> | null>(null);
  // The cart cookie outlives each turn, so prepare it once and keep sends off the network.
  const prepareSession = useCallback(() => {
    if (sessionPrep.current) return sessionPrep.current;
    const promise = prepareAgentSession();
    sessionPrep.current = promise;
    promise.catch(() => {
      if (sessionPrep.current === promise) sessionPrep.current = null;
    });
    return promise;
  }, []);
  const agent = useEveAgent({
    initialSession: fixture ? undefined : stored.session,
    onError(cause) {
      setPendingSend(false);
      clearAttempt.current?.reject(cause);
    },
    onFinish(finished) {
      setPendingSend(false);
      if (finished.error) clearAttempt.current?.reject(finished.error);
      else clearAttempt.current?.resolve();
    },
    onSessionChange(session) {
      snapshot.current.session = session ? { ...session, streamIndex: 0 } : undefined;
      writeStoredChat(snapshot.current);
    },
    async prepareSend(turn) {
      await prepareSession();
      return {
        ...turn,
        clientContext: {
          locale: location.pathname === "/ar" || location.pathname.startsWith("/ar/") ? "ar" : "en",
          pathname: location.pathname,
          search: location.search,
        },
        turnPolicy: "queue",
      };
    },
    resume: !fixture && Boolean(stored.session && stored.turnActive),
  });
  const { data, error, status } = agent;
  const { messages } = data;
  // A session-limit prompt holds its turn open, so the stream stays "streaming" while it waits.
  const hasReachedLimit = openConversationInputs(data).some(
    (pending) => pending.request.kind === "session-limit",
  );
  const restoring = resumePending || status === "resuming";
  const dispatching = pendingSend && status === "ready";
  const busy =
    !hasReachedLimit &&
    (dispatching || status === "submitted" || status === "streaming" || status === "resuming");
  const awaitingReply =
    !hasReachedLimit &&
    (dispatching ||
      status === "submitted" ||
      (status === "streaming" && messages.at(-1)?.role === "user"));
  useEffect(() => {
    if (fixture || !open) return;
    void prepareSession().catch(() => {});
  }, [fixture, open, prepareSession]);
  useEffect(() => {
    if (fixture) return;
    snapshot.current.turnActive = busy;
    writeStoredChat(snapshot.current);
  }, [busy, fixture]);
  useEffect(() => {
    const node = panelRef.current;
    const viewport = window.visualViewport;
    if (!open || !node || !viewport) return;
    const sync = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      node.style.setProperty("--agent-keyboard", `${Math.round(covered)}px`);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, [open]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const userScrollRef = useRef(false);
  const pointerDownRef = useRef(false);
  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, []);
  const markUserScroll = useCallback(() => {
    userScrollRef.current = true;
  }, []);
  // Programmatic scrolls also fire scroll events; only user input may unpin from the bottom.
  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
    if (atBottom) pinnedRef.current = true;
    else if (userScrollRef.current || pointerDownRef.current) pinnedRef.current = false;
    userScrollRef.current = false;
  }, []);
  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) scrollToBottom();
    });
    observer.observe(content);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [scrollToBottom]);
  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, scrollToBottom]);
  const [restoreDelayElapsed, setRestoreDelayElapsed] = useState(false);
  useEffect(() => {
    if (status !== "resuming") return;
    const timer = setTimeout(() => setRestoreDelayElapsed(true), 400);
    return () => clearTimeout(timer);
  }, [status]);
  const showRestoring = status === "resuming" && restoreDelayElapsed;
  useEffect(() => {
    if (fixture) return;
    snapshot.current.input = input;
    const timer = setTimeout(() => writeStoredChat(snapshot.current), 400);
    return () => clearTimeout(timer);
  }, [fixture, input]);
  useEffect(() => {
    const flush = () => writeStoredChat(snapshot.current);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
      clearAttempt.current?.reject(new Error("Conversation closed"));
      clearAttempt.current = null;
    };
  }, []);
  function clearChat() {
    setAgentCartStatus("pending");
    agent.reset();
    setResumePending(false);
    setInput("");
    setPendingSend(false);
    setClearing(false);
    setControlError(null);
    snapshot.current = { input: "" };
    writeStoredChat(snapshot.current);
  }
  const handleStop = () => {
    setControlError(null);
    void agent.cancel().catch(() => {
      setControlError("Could not stop the response. Please try again.");
    });
  };
  const handleSend = (text: string) => {
    if (fixture) {
      pinnedRef.current = true;
      setFixtureNote(text);
      setFixtureBusy(true);
      setInput("");
      setControlError(null);
      window.setTimeout(() => setFixtureBusy(false), 700);
      return;
    }
    if (busy || restoring || clearing || cartPending || hasReachedLimit) return;
    pinnedRef.current = true;
    snapshot.current.turnActive = true;
    writeStoredChat(snapshot.current);
    setPendingSend(true);
    setAgentCartStatus("pending");
    setControlError(null);
    void agent.send(text).catch(() => {
      setPendingSend(false);
      setControlError("Could not send your message. Try again, or clear an expired conversation.");
    });
    setInput("");
  };
  const handleClear = async () => {
    if (fixture) {
      setFixtureNote(null);
      setFixtureBusy(false);
      setInput("");
      setControlError(null);
      return;
    }
    if (clearAttempt.current) return;
    setClearing(true);
    setControlError(null);
    const attempt = Promise.withResolvers<void>();
    clearAttempt.current = attempt;
    const timeout = setTimeout(
      () => attempt.reject(new Error("Cancellation timed out")),
      CANCEL_TIMEOUT_MS,
    );
    try {
      void agent.cancel().then((result) => {
        if (result.status === "no_active_turn") attempt.resolve();
      }, attempt.reject);
      await attempt.promise;
      if (clearAttempt.current !== attempt) return;
      clearChat();
      if (busy || status === "error")
        setControlError(
          "Started a new chat. Check your cart before repeating an interrupted change.",
        );
    } catch {
      if (clearAttempt.current === attempt)
        setControlError(
          "Could not confirm the response stopped. Your conversation was kept. Try Stop or Clear again.",
        );
    } finally {
      clearTimeout(timeout);
      if (clearAttempt.current === attempt) {
        clearAttempt.current = null;
        setClearing(false);
      }
    }
  };
  return (
    <Sheet
      onOpenChange={(next) => onOpenChange(next)}
      onOpenChangeComplete={(opened) => {
        if (!opened) return;
        scrollToBottom();
        if (fixture || !resumePending) return;
        setResumePending(false);
        void agent.resume().catch(() => {});
      }}
      open={open}
    >
      <SheetContent
        ref={panelRef}
        className="gap-0 p-0"
        closeButton={false}
        finalFocus={triggerRef}
        initialFocus={() => panelRef.current?.querySelector("textarea") ?? true}
        keepMounted
        overlay={false}
        presentation="floating"
        side="right"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2.5 ps-2">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#efe6d2] text-foreground"
            >
              <MessageCircleIcon className="size-4" />
            </span>
            <SheetTitle className="truncate font-medium text-base">
              {t("Shirtat Assistant")}
            </SheetTitle>
          </div>
          <div className="flex items-center">
            <button
              aria-label={t("Clear chat")}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-40"
              disabled={
                clearing ||
                (fixture === null &&
                  !messages.length &&
                  !input.trim() &&
                  !agent.session &&
                  !busy) ||
                (fixture !== null && !fixtureNote && !input.trim())
              }
              onClick={handleClear}
              type="button"
            >
              <Trash2Icon className="size-5" />
            </button>
            <SheetClose
              aria-label={t("Close Shirtat Assistant")}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground hover:bg-[#efe6d2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <XIcon className="size-5" />
            </SheetClose>
          </div>
        </div>
        {fixture ? <p className="px-5 text-xs text-foreground/70">{t("Test fixture")}</p> : null}
        <SheetDescription className="sr-only">
          {t("Find products, ask store questions, and manage your cart.")}
        </SheetDescription>
        <div
          ref={scrollRef}
          data-slot="agent-messages"
          onKeyDown={markUserScroll}
          onPointerDown={() => {
            pointerDownRef.current = true;
          }}
          onPointerUp={() => {
            pointerDownRef.current = false;
          }}
          onScroll={handleScroll}
          onTouchMove={markUserScroll}
          onWheel={markUserScroll}
          className="min-h-0 flex-auto overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div
            ref={contentRef}
            aria-busy={busy}
            aria-label="Conversation"
            className="flex min-h-full flex-col justify-end gap-8 px-5 py-6 [&>*]:shrink-0 data-[welcome=true]:justify-start"
            data-welcome={fixture === "welcome" || (!fixture && messages.length === 0)}
            role="log"
          >
            {fixture ? (
              <FixtureTranscript
                busy={fixtureBusy || fixture === "loading"}
                kind={fixture}
                note={fixtureNote}
                onSuggest={handleSend}
              />
            ) : messages.length === 0 ? (
              restoring ? (
                showRestoring && (
                  <p className="text-muted-foreground text-sm">
                    {t("Restoring your conversation…")}
                  </p>
                )
              ) : (
                !awaitingReply && <Welcome onSuggest={handleSend} />
              )
            ) : (
              messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  isLatest={index === messages.length - 1}
                  isStreaming={
                    status === "streaming" && !hasReachedLimit && index === messages.length - 1
                  }
                  message={message}
                  onFollowUp={handleSend}
                />
              ))
            )}
            {!fixture && awaitingReply && <AgentThinking active />}
          </div>
        </div>
        {(clearing || (showRestoring && messages.length > 0)) && (
          <p role="status" className="px-5 py-2 text-muted-foreground text-sm">
            {clearing ? t("Waiting for the response to stop…") : t("Restoring your conversation…")}
          </p>
        )}
        {hasReachedLimit && (
          <p role="alert" className="px-5 py-2 text-sm">
            {t("This conversation has reached its limit. Clear chat to start a new conversation.")}
          </p>
        )}
        <AgentCartBridge messages={fixture ? [] : messages} status={fixture ? "ready" : status} />
        <AgentComposer
          disabled={fixture ? false : !busy && (clearing || cartPending || hasReachedLimit)}
          onChange={(value) => {
            setInput(value);
            if (!fixture) void prepareSession().catch(() => {});
          }}
          onStop={fixture ? () => setFixtureBusy(false) : handleStop}
          onSubmit={handleSend}
          placeholder={t("Ask about a shirt, a gift, or a style…")}
          status={
            fixtureBusy || fixture === "loading"
              ? "submitted"
              : fixture
                ? "ready"
                : dispatching
                  ? "submitted"
                  : hasReachedLimit
                    ? "ready"
                    : resumePending
                      ? "resuming"
                      : status
          }
          value={input}
        />
        {!fixture && (error || controlError) && (
          <p role="alert" className="px-5 pb-3 text-destructive text-sm">
            {controlError ??
              t("The assistant is unavailable. Try again, or clear an expired conversation.")}
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Welcome({ onSuggest }: { onSuggest: (text: string) => void }) {
  const t = useT();
  return (
    <div className="grid gap-6">
      <p className="max-w-xs text-base leading-7">
        {t("Looking for a shirt, a gift, or a line of calligraphy?")}
      </p>
      <div className="flex flex-wrap gap-2">
        {WELCOME_SUGGESTIONS.map(([label, prompt]) => (
          <button
            className="min-h-11 cursor-pointer rounded-full bg-[#efe6d2] px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e8]"
            key={label}
            onClick={() => onSuggest(t(prompt))}
            type="button"
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function FixtureTranscript({
  busy,
  kind,
  note,
  onSuggest,
}: {
  busy: boolean;
  kind: NonNullable<ReturnType<typeof readAgentFixture>>;
  note: string | null;
  onSuggest: (text: string) => void;
}) {
  const t = useT();
  return (
    <>
      {kind === "cards-stay" ? <CapturedStream /> : null}
      {kind === "welcome" && !note ? <Welcome onSuggest={onSuggest} /> : null}
      <AgentFixtureScene followUp={onSuggest} kind={kind} />
      {kind === "cart" ? <AgentCartSummary /> : null}
      {kind === "error" ? (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-[1.25rem] bg-[#e7dcc8] px-4 py-3 text-sm leading-6">
            {t("Help me choose a gift")}
          </div>
        </div>
      ) : null}
      {note ? (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-[1.25rem] bg-[#e7dcc8] px-4 py-3 text-sm leading-6">
            {note}
          </div>
        </div>
      ) : null}
      {busy ? <AgentThinking active /> : null}
      {kind === "error" || (note && !busy) ? (
        <p className="text-destructive text-sm" role="alert">
          {kind === "error"
            ? t("The assistant is unavailable. Try again, or clear an expired conversation.")
            : t("Test fixture. This preview does not call the model.")}
        </p>
      ) : null}
    </>
  );
}
