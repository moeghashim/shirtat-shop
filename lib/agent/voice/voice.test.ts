import assert from "node:assert/strict";
import test from "node:test";

import { productCardHandles } from "../openui/cards";
import {
  admitMint,
  applyShopperDelta,
  applyShopperFinal,
  emptyLedger,
  emptyLiveCardsPlan,
  finishLiveCards,
  isLiveCardsResponse,
  liveCardsRequest,
  noteShopperText,
  pageLocale,
  settleReservation,
  tickLiveCards,
  transcriptCanSearch,
  voiceInstructions,
  voiceLimits,
  voiceModeEnabled,
  voiceProgram,
  VOICE_REALTIME_MODEL,
} from "./index";
import { parseVoiceToolArguments, realtimeTools } from "./schema";

const limits = voiceLimits({});

test("voice defaults on for preview and off for production", () => {
  assert.equal(voiceModeEnabled({}), true);
  assert.equal(voiceModeEnabled({ VERCEL_ENV: "preview" }), true);
  assert.equal(voiceModeEnabled({ VERCEL_ENV: "production" }), false);
  assert.equal(voiceModeEnabled({ VERCEL_ENV: "production", VOICE_MODE_ENABLED: "1" }), true);
  assert.equal(voiceModeEnabled({ VERCEL_ENV: "preview", VOICE_MODE_ENABLED: "0" }), false);
  assert.equal(voiceModeEnabled({ VOICE_MODE_ENABLED: "true" }), true);
});

test("page locale follows the Arabic prefix", () => {
  assert.equal(pageLocale("/ar"), "ar");
  assert.equal(pageLocale("/ar/products/tafakkar-t-shirt"), "ar");
  assert.equal(pageLocale("/products/tafakkar-t-shirt"), "en");
});

test("a voice session reserves five minutes and settles the unused time", () => {
  const first = admitMint(
    emptyLedger("2026-11-10"),
    [],
    Date.parse("2026-11-10T00:00:00Z"),
    limits,
    "voice_one",
  );
  assert.equal(first.result.ok, true);
  assert.equal(first.ledger.sessions, 1);
  assert.equal(first.ledger.seconds, 300);
  const settled = settleReservation(first.ledger, "voice_one", 60);
  assert.equal(settled.seconds, 60);
  assert.equal(settleReservation(settled, "voice_one", 10).seconds, 60);
});

test("minting stops at the daily session cap and the caller rate limit", () => {
  let ledger = emptyLedger("2026-11-10");
  let hits: number[] = [];
  for (let index = 0; index < limits.dailySessionCap; index += 1) {
    const next = admitMint(ledger, [], 0, { ...limits, mintLimit: 100 }, `voice_${index}`);
    assert.equal(next.result.ok, true);
    ledger = next.ledger;
  }
  assert.equal(admitMint(ledger, [], 0, limits, "voice_over").result.ok, false);
  for (let index = 0; index < limits.mintLimit; index += 1) {
    const next = admitMint(emptyLedger("2026-11-10"), hits, 1_000, limits, `voice_rate_${index}`);
    assert.equal(next.result.ok, true);
    hits = next.hits;
  }
  const blocked = admitMint(emptyLedger("2026-11-10"), hits, 1_000, limits, "voice_rate_over");
  assert.deepEqual(blocked.result, { code: "rate_limited", ok: false });
});

test("live cards wait for a short gap and do not repeat the same words", () => {
  let plan = noteShopperText(emptyLiveCardsPlan(), "hood", 0);
  assert.equal(tickLiveCards(plan, 199).send, null);
  plan = noteShopperText(plan, "hoodie", 100);
  const sent = tickLiveCards(plan, 300);
  assert.equal(sent.send, "hoodie");
  assert.equal(tickLiveCards(sent.plan, 800).send, null);
  const again = tickLiveCards(
    noteShopperText(finishLiveCards(sent.plan), "hoodie please", 800),
    1_100,
  );
  assert.equal(again.send, "hoodie please");
  assert.equal(transcriptCanSearch("a"), false);
  assert.equal(transcriptCanSearch("أرني هودي"), true);
});

test("shopper transcript deltas append and the final transcript replaces them", () => {
  assert.equal(applyShopperDelta(applyShopperDelta("", "Show "), "me"), "Show me");
  assert.equal(applyShopperFinal("  أرني هودي  "), "أرني هودي");
});

test("voice instructions follow the page language and the realtime model stays fixed", () => {
  assert.match(voiceInstructions("ar"), /Arabic/);
  assert.match(voiceInstructions("en", true), /partial transcript/);
  assert.equal(VOICE_REALTIME_MODEL, "gpt-realtime-2.1");
  const request = liveCardsRequest("blue hoodie", "en");
  assert.equal(request.response.conversation, "none");
  assert.equal(request.response.output_modalities[0], "text");
  assert.equal(isLiveCardsResponse(request.response.metadata), true);
});

test("realtime tools reject a cart id and render OpenUI cards", () => {
  assert.equal(
    "error" in
      parseVoiceToolArguments("search-catalog", {
        cartId: "gid://shopify/Cart/1",
        query: "hoodie",
      }),
    true,
  );
  const parsed = parseVoiceToolArguments("add-to-cart", {
    variantId: "gid://shopify/ProductVariant/1",
  });
  assert.equal("data" in parsed && parsed.data.quantity, 1);
  assert.ok(realtimeTools().some((tool) => tool.name === "search-catalog"));
  const program = voiceProgram({
    cart: true,
    choices: [{ label: 'Say "hi"', message: 'Say "hi"' }],
    chooser: "tafakkar-t-shirt",
    handles: ["tafakkar-t-shirt", "bad handle", "ana-ibn-jala-hoodie"],
  });
  assert.ok(program);
  assert.deepEqual(productCardHandles(program, true), ["tafakkar-t-shirt", "ana-ibn-jala-hoodie"]);
  assert.match(program, /Chooser\("tafakkar-t-shirt"\)/);
  assert.match(program, /@ToAssistant\("Say \\"hi\\""\)/);
});
