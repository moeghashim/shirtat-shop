"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";
import { voiceProgram, type VoiceChoice, type VoiceToolView } from "@/lib/agent/voice";
import { connectVoice, type VoiceConnection, type VoiceFailure } from "@/lib/agent/voice/browser";
import { useCartActions } from "@/lib/cart/client";
import { useLocale } from "@/lib/i18n/client";

import { OpenUiMessage } from "./openui";

export type VoiceActivity = "connecting" | "idle" | "listening" | "speaking";

export interface VoiceExchange {
  assistant: string;
  cart: boolean;
  choices: VoiceChoice[];
  chooser: string | null;
  id: string;
  products: Array<AgentProduct | AgentProductDetails>;
  shopper: string;
}

export function useShirtatVoice(active: boolean) {
  const locale = useLocale();
  const { refresh } = useCartActions();
  const [enabled, setEnabled] = useState(false);
  const [activity, setActivity] = useState<VoiceActivity>("idle");
  const [failure, setFailure] = useState<VoiceFailure | null>(null);
  const [exchanges, setExchanges] = useState<VoiceExchange[]>([]);
  const connection = useRef<VoiceConnection | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const attempt = useRef(0);
  const live = useRef(false);
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void fetch("/api/agent/voice", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { enabled?: boolean } | null) => {
        if (!cancelled && data?.enabled) setEnabled(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [active]);

  const patchLast = useCallback((update: (exchange: VoiceExchange) => VoiceExchange) => {
    setExchanges((current) => {
      const last = current.at(-1);
      if (!last) return current;
      return [...current.slice(0, -1), update(last)];
    });
  }, []);

  const stop = useCallback(() => {
    live.current = false;
    attempt.current += 1;
    connection.current?.stop();
    connection.current = null;
    setActivity("idle");
  }, []);

  const ensureExchange = useCallback(() => {
    setExchanges((current) => {
      if (current.length) return current;
      return [blankExchange()];
    });
  }, []);

  const start = useCallback(() => {
    if (live.current) {
      stop();
      return;
    }
    const id = attempt.current + 1;
    attempt.current = id;
    live.current = true;
    const element = new Audio();
    element.autoplay = true;
    audio.current = element;
    setFailure(null);
    setActivity("connecting");
    ensureExchange();
    void connectVoice(
      locale,
      {
        onActivity(next) {
          if (attempt.current === id) setActivity(next);
        },
        onAssistant(text) {
          patchLast((exchange) => ({ ...exchange, assistant: text }));
        },
        onFailure(code) {
          if (attempt.current === id) setFailure(code);
        },
        onShopper(text) {
          patchLast((exchange) => ({ ...exchange, shopper: text }));
        },
        onTool(view) {
          patchLast((exchange) => applyToolView(exchange, view));
          if (view.cart) refreshRef.current();
        },
        onUtterance() {
          setExchanges((current) => [...current, blankExchange()]);
        },
      },
      element,
    )
      .then((next) => {
        if (attempt.current !== id) {
          next.stop();
          return;
        }
        connection.current = next;
      })
      .catch((error: unknown) => {
        if (attempt.current !== id) return;
        live.current = false;
        setActivity("idle");
        setFailure(
          error instanceof Error && "code" in error ? (error.code as VoiceFailure) : "unavailable",
        );
      });
  }, [ensureExchange, locale, patchLast, stop]);

  const say = useCallback((text: string) => {
    if (!connection.current) return false;
    connection.current.say(text);
    setExchanges((current) => [...current, { ...blankExchange(), shopper: text }]);
    return true;
  }, []);

  const clear = useCallback(() => {
    stop();
    setExchanges([]);
    setFailure(null);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { activity, clear, enabled, exchanges, failure, say, start, stop };
}

export function VoiceExchangeView({
  exchange,
  onFollowUp,
}: {
  exchange: VoiceExchange;
  onFollowUp: (text: string) => void;
}) {
  if (
    !exchange.shopper &&
    !exchange.assistant &&
    !exchange.products.length &&
    !exchange.cart &&
    !exchange.choices.length &&
    !exchange.chooser
  )
    return null;
  const program = voiceProgram({
    cart: exchange.cart,
    choices: exchange.choices,
    chooser: exchange.chooser,
    handles: exchange.products.map((product) => product.handle),
  });
  const facts = new Map(exchange.products.map((product) => [product.handle, product]));
  return (
    <div className="grid gap-5">
      {exchange.shopper ? (
        <div className="flex justify-end">
          <div
            className="max-w-[85%] rounded-[1.25rem] bg-[#e7dcc8] px-4 py-3 text-base leading-6 text-foreground"
            dir="auto"
          >
            {exchange.shopper}
          </div>
        </div>
      ) : null}
      {exchange.assistant ? (
        <p className="text-base leading-7 text-foreground" dir="auto">
          {exchange.assistant}
        </p>
      ) : null}
      {program ? (
        <OpenUiMessage
          facts={facts}
          isStreaming={false}
          onFollowUp={onFollowUp}
          program={program}
          toolHandles={[]}
        />
      ) : null}
    </div>
  );
}

function applyToolView(exchange: VoiceExchange, view: VoiceToolView): VoiceExchange {
  const next = { ...exchange };
  if (view.products.length && !view.chooser) next.products = view.products;
  if (view.chooser) {
    next.chooser = view.chooser;
    const detail = view.products.find((product) => product.handle === view.chooser);
    if (detail)
      next.products = [
        ...exchange.products.filter((product) => product.handle !== detail.handle),
        detail,
      ];
  }
  if (view.choices.length) next.choices = view.choices;
  if (view.cart) next.cart = true;
  return next;
}

function blankExchange(): VoiceExchange {
  return {
    assistant: "",
    cart: false,
    choices: [],
    chooser: null,
    id: crypto.randomUUID(),
    products: [],
    shopper: "",
  };
}
