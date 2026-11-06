"use client";

import type { EveMessage } from "eve/react";
import { memo } from "react";
import { defaultUrlTransform, Streamdown, type UrlTransform } from "streamdown";

import { getCartMutationResult } from "@/lib/agent/cart";
import { keepSettledProductCards, settledRecommendationHandles } from "@/lib/agent/openui/cards";
import { useT } from "@/lib/i18n/client";

import { OpenUiMessage, openUiSource } from "./openui";
import { ShoppingResults } from "./shopping-results";
import { AgentThinking } from "./thinking";

const SHOPIFY_CDN = "https://cdn.shopify.com/";

const linkSafety = {
  enabled: true,
  onLinkCheck: (url: string) => url.startsWith("/") && !url.startsWith("//"),
};
const urlTransform: UrlTransform = (url, key, node) =>
  key === "src" && !url.startsWith(SHOPIFY_CDN) ? null : defaultUrlTransform(url, key, node);
const Markdown = memo(({ children }: { children: string }) => (
  <Streamdown
    linkSafety={linkSafety}
    urlTransform={urlTransform}
    className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
  >
    {children}
  </Streamdown>
));

export function ChatMessage({
  isLatest,
  isStreaming,
  message,
  onFollowUp,
}: {
  isLatest: boolean;
  isStreaming: boolean;
  message: EveMessage;
  onFollowUp: (text: string) => void;
}) {
  const t = useT();
  const text = message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");
  const program = message.role === "assistant" ? openUiSource(text) : null;
  const toolHandles = settledRecommendationHandles(message.parts);
  const showToolCards = keepSettledProductCards(toolHandles);
  if (message.role === "user")
    return text ? (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[1.25rem] bg-[#e7dcc8] px-4 py-3 text-base leading-6 text-foreground">
          <Markdown>{text}</Markdown>
        </div>
      </div>
    ) : null;
  const mutations = message.parts.flatMap((part) => {
    const result = getCartMutationResult(part);
    return result ? [result] : [];
  });
  const warnings = [...new Set(mutations.flatMap((mutation) => mutation.warnings))];
  const showsLiveCart = isLatest && mutations.length > 0;
  const active = message.parts.find(
    (part) =>
      part.type === "dynamic-tool" &&
      part.state !== "output-available" &&
      part.state !== "output-error",
  );
  const waitsForInput = message.parts.some(
    (part) => part.type === "dynamic-tool" && part.state === "approval-requested",
  );
  return (
    <div className="grid gap-5 text-foreground text-base leading-7">
      <AgentThinking
        active={isStreaming && !text}
        tool={active?.type === "dynamic-tool" ? active.toolName : undefined}
      />
      {program ? (
        <OpenUiMessage
          isStreaming={isStreaming}
          message={message}
          onFollowUp={onFollowUp}
          program={program}
          toolHandles={toolHandles}
        />
      ) : (
        text && <Markdown>{text}</Markdown>
      )}
      {!program || showToolCards ? (
        <ShoppingResults
          confirmation={program || !showsLiveCart ? undefined : { warnings }}
          fallback={
            program || !(isLatest && !isStreaming && !text && !waitsForInput) ? null : (
              <p className="text-muted-foreground">{t("No response. Try asking again.")}</p>
            )
          }
          isLatest={isLatest}
          isStreaming={isStreaming}
          message={message}
          productCardsOnly={Boolean(program)}
        />
      ) : null}
    </div>
  );
}
