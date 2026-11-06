import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExport,
  chatReviewCaptureEnabled,
  freezeTurn,
  gradeChecks,
  projectTurns,
  redactReviewText,
  reviewAccess,
  reviewExportResponse,
  sealTurn,
  textDirection,
  type FrozenTurn,
  type TurnFeedback,
} from "./index";

const owner = { email: "moe@10claws.com", isAdmin: true };
const creator = { email: "maker@example.com", isAdmin: false };
const forged = { email: "maker@example.com", isAdmin: true };

test("review access denies everyone except the owner session", () => {
  assert.equal(reviewAccess(null), false);
  assert.equal(reviewAccess(creator), false);
  assert.equal(reviewAccess(forged), false);
  assert.equal(reviewAccess({ email: "Moe@10claws.com", isAdmin: true }), true);
  assert.equal(reviewAccess(owner), true);
});

test("capture stays off unless the flag is exactly 1", () => {
  const previous = process.env.CHAT_REVIEW_CAPTURE;
  delete process.env.CHAT_REVIEW_CAPTURE;
  assert.equal(chatReviewCaptureEnabled(), false);
  process.env.CHAT_REVIEW_CAPTURE = "true";
  assert.equal(chatReviewCaptureEnabled(), false);
  process.env.CHAT_REVIEW_CAPTURE = "1";
  assert.equal(chatReviewCaptureEnabled(), true);
  if (previous === undefined) delete process.env.CHAT_REVIEW_CAPTURE;
  else process.env.CHAT_REVIEW_CAPTURE = previous;
});

test("a turn version is the redacted text, and Arabic renders RTL", () => {
  const events = [
    {
      data: { message: "أريد هدية. اكتبوا إلى a@b.co", turnId: "turn_0" },
      type: "message.received",
    },
    { data: { modelId: "gpt-6-luna", turnId: "turn_0" }, type: "step.started" },
    {
      data: { finishReason: "tool-calls", message: "Searching", turnId: "turn_0" },
      type: "message.completed",
    },
    {
      data: { finishReason: "stop", message: "القميص بـ 33.99", turnId: "turn_0" },
      type: "message.completed",
    },
  ];
  const [turn] = projectTurns(events);
  assert.equal(turn?.shopper.includes("a@b.co"), false);
  assert.equal(turn?.shopper.includes("[email]"), true);
  assert.equal(turn?.assistant, "القميص بـ 33.99");
  assert.equal(turn?.direction, "rtl");
  assert.equal(turn?.modelId, "gpt-6-luna");
  assert.match(turn?.version ?? "", /^[a-f0-9]{64}$/);
  assert.equal(projectTurns(events)[0]?.version, turn?.version);
});

test("export stays tied to the frozen version and does not judge manual lines", async () => {
  const projected = sealTurn("turn_1", {
    assistant: "The white shirt is $33.99.",
    modelId: "gpt-6-luna",
    shopper: redactReviewText("Email me at sam@shop.test about gid://shopify/Product/1"),
  });
  assert.ok(projected);
  const turn: FrozenTurn = freezeTurn(
    "wrun_example123",
    projected,
    new Date("2026-11-06T00:00:00Z"),
  );
  const feedback: TurnFeedback = {
    checks: [
      { kind: "includes", text: "$33.99" },
      { kind: "excludes", text: "checkout" },
      { kind: "manual", text: "The tone is calm" },
    ],
    expected: "Name the price and do not start checkout.",
    savedAt: "2026-11-06T00:00:00Z",
    sessionId: turn.sessionId,
    turnId: turn.turnId,
    turnVersion: turn.version,
    verdict: "pass",
  };
  const exported = buildExport(turn, feedback);
  assert.ok(exported);
  assert.equal(exported.turnVersion, turn.version);
  assert.equal(exported.executable, "pass");
  assert.equal(exported.checks.find((check) => check.kind === "manual")?.result, "manual");
  assert.equal(exported.ownerVerdict, "pass");
  assert.equal(exported.shopper.includes("sam@shop.test"), false);
  assert.equal(exported.shopper.includes("gid://shopify"), false);
  assert.equal(buildExport(turn, { ...feedback, turnVersion: "a".repeat(64) }), null);

  const denied = reviewExportResponse(creator, { feedback, turn });
  assert.equal(denied.status, 404);
  assert.equal(await denied.text(), "");
  const allowed = reviewExportResponse(owner, { feedback, turn });
  const body = await allowed.json();
  assert.equal(body.turnVersion, turn.version);
  assert.equal(body.judging.modelJudge.includes("does not run an LLM judge"), true);
  assert.equal(JSON.stringify(body).includes("sam@shop.test"), false);
});

test("a failed includes check does not become a model judgment", () => {
  const graded = gradeChecks("No price here", [{ kind: "includes", text: "$33.99" }]);
  assert.deepEqual(graded, [{ kind: "includes", result: "fail", text: "$33.99" }]);
  assert.equal(textDirection("Gift: تفكّر في الهدية"), "rtl");
  assert.equal(
    gradeChecks("checkout now", [{ kind: "excludes", text: "checkout" }])[0]?.result,
    "fail",
  );
});
