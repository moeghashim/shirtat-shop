"use client";

import type { EveMessage } from "eve/react";
import { useState } from "react";

import type { AgentProduct } from "@/lib/agent/products/types";
import { useLocale, useT } from "@/lib/i18n/client";

import { ChatMessage } from "./chat-message";

const TEE_IMAGE =
  "https://cdn.shopify.com/s/files/1/0678/2474/6718/files/tafakkar-reflect-tfkr-t-shirt.jpg?v=1792620392";
const HOODIE_IMAGE =
  "https://cdn.shopify.com/s/files/1/0678/2474/6718/files/ana-ibn-jala-ana-abn-gla-otlaaa-althnaya-hoodie.jpg?v=1792866635";
const PRINT_IMAGE =
  "https://cdn.shopify.com/s/files/1/0678/2474/6718/files/al-hubb-wal-salam-alhb-oalslam-print_8caea5c6-47ac-4678-936d-45f0586a527a.jpg?v=1792651162";

const PRODUCTS: AgentProduct[] = [
  {
    available: true,
    compareAtPrice: null,
    handle: "tafakkar-t-shirt",
    image: TEE_IMAGE,
    price: { amount: "33.99", currencyCode: "USD" },
    title: "Tafakkar – Reflect (تفكّر) T-shirt",
    vendor: "Shirtat",
  },
  {
    available: true,
    compareAtPrice: null,
    handle: "ana-ibn-jala-hoodie",
    image: HOODIE_IMAGE,
    price: { amount: "64.99", currencyCode: "USD" },
    title: "Ana Ibn Jala (أنا ابن جلا وطلاع الثنايا) Hoodie",
    vendor: "Shirtat",
  },
];

const PRINT: AgentProduct = {
  available: true,
  compareAtPrice: null,
  handle: "al-hubb-wal-salam-print",
  image: PRINT_IMAGE,
  price: { amount: "27.99", currencyCode: "USD" },
  title: "Al Hubb wal Salam (الحب والسلام) Print",
  vendor: "Shirtat",
};

type CapturedStage = "done" | "matched" | "next" | "print" | "stream" | "tee";

function readStage(search: string): CapturedStage {
  const value = new URLSearchParams(search).get("assistant-stage");
  if (
    value === "stream" ||
    value === "next" ||
    value === "matched" ||
    value === "print" ||
    value === "tee"
  )
    return value;
  return "done";
}

function handleList(handles: readonly string[]) {
  return handles.map((handle) => JSON.stringify(handle)).join(", ");
}

function namedProgram(note: string, handles: readonly string[]) {
  return `cards = ProductCards(handles: [${handleList(handles)}])
note = Note(${JSON.stringify(note)})
root = Stack([note, cards])`;
}

function partialProgram(note: string, handles: readonly string[]) {
  return `cards = ProductCards(handles: [${handleList(handles)}])
note = Note(${JSON.stringify(note)})
root = Stack([note`;
}

function positionalProgram(note: string, handles: readonly string[]) {
  return `cards = ProductCards([${handleList(handles)}])
note = Note(${JSON.stringify(note)})
root = Stack([note, cards])`;
}

function noteProgram(note: string) {
  return `note = Note(${JSON.stringify(note)})
root = Stack([note])`;
}

function recommendation(program: string, products: AgentProduct[], streaming: boolean): EveMessage {
  return {
    id: "captured-recommendation",
    metadata: { status: streaming ? "streaming" : "complete" },
    parts: [
      {
        input: { ids: ["gid://shopify/Product/fixture"] },
        output: { products },
        state: "output-available",
        toolCallId: "captured-present",
        toolName: "present-products",
        type: "dynamic-tool",
      },
      { state: streaming ? "streaming" : "done", text: program, type: "text" },
    ],
    role: "assistant",
  };
}

export function CapturedStream() {
  const locale = useLocale();
  const t = useT();
  const [stage] = useState(() => readStage(window.location.search));
  const products = stage === "print" ? [PRINT] : stage === "tee" ? [PRODUCTS[0]] : PRODUCTS;
  const lead =
    stage === "print"
      ? locale === "ar"
        ? "طباعة من المتجر."
        : "A print from the shop."
      : stage === "tee"
        ? locale === "ar"
          ? "قميص من المتجر."
          : "A shirt from the shop."
        : locale === "ar"
          ? "قطعتان من المتجر."
          : "Two pieces from the shop.";
  const followUp = locale === "ar" ? "أيّهما يصلح هدية؟" : "Which one is a gift?";
  const later =
    locale === "ar"
      ? "كلاهما في المتجر. البطاقات أعلاه من الرد السابق."
      : "Both are in the shop. The cards above stay from the last reply.";
  const streaming = stage === "stream";
  const handles = products.map((product) => product.handle);
  const program =
    stage === "stream"
      ? partialProgram(lead, handles)
      : stage === "matched"
        ? positionalProgram(lead, handles)
        : namedProgram(lead, handles);
  const first = recommendation(program, products, streaming);
  const laterMessages: EveMessage[] =
    stage === "next"
      ? [
          { id: "captured-user", parts: [{ text: followUp, type: "text" }], role: "user" },
          {
            id: "captured-follow-up",
            metadata: { status: "complete" },
            parts: [{ state: "done", text: noteProgram(later), type: "text" }],
            role: "assistant",
          },
        ]
      : [];
  const messages = [first, ...laterMessages];
  return (
    <div className="grid gap-8" data-captured-stage={stage}>
      <p className="text-xs text-foreground/70">
        {t("Captured stream fixture. Not a live model reply.")}
      </p>
      {messages.map((message, index) => (
        <ChatMessage
          isLatest={index === messages.length - 1}
          isStreaming={streaming && index === 0}
          key={message.id}
          message={message}
          onFollowUp={() => {}}
        />
      ))}
    </div>
  );
}
