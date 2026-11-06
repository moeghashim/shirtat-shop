import { defineHook } from "eve/hooks";

import {
  chatReviewCaptureEnabled,
  emptyDraft,
  freezeTurn,
  isSessionId,
  isTurnId,
  sealTurn,
  withAssistant,
  withModel,
  withShopper,
} from "../../lib/chat-review/index";
import { readDraft, saveFrozenTurn, writeDraft } from "../../lib/chat-review/store";

// Capture stays off unless CHAT_REVIEW_CAPTURE=1. Hooks are at-least-once; the turn file is keyed by its text hash.
export default defineHook({
  events: {
    async "message.completed"(event, ctx) {
      await note(ctx.session.id, event.data.turnId, (draft) =>
        withAssistant(draft, event.data.message, event.data.finishReason),
      );
    },
    async "message.received"(event, ctx) {
      await note(ctx.session.id, event.data.turnId, (draft) =>
        withShopper(draft, event.data.message),
      );
    },
    async "step.started"(event, ctx) {
      await note(ctx.session.id, event.data.turnId, (draft) =>
        withModel(draft, event.data.modelId),
      );
    },
    async "turn.completed"(event, ctx) {
      if (!chatReviewCaptureEnabled()) return;
      const sessionId = ctx.session.id;
      const turnId = event.data.turnId;
      if (!isSessionId(sessionId) || !isTurnId(turnId)) return;
      try {
        const draft = (await readDraft(sessionId, turnId)) ?? emptyDraft();
        const sealed = sealTurn(turnId, draft);
        if (!sealed) return;
        await saveFrozenTurn(freezeTurn(sessionId, sealed, new Date()));
      } catch {
        // A missed copy can be frozen later when the owner opens the session. The turn still finishes.
      }
    },
  },
});

async function note(
  sessionId: string,
  turnId: string,
  update: (draft: ReturnType<typeof emptyDraft>) => ReturnType<typeof emptyDraft>,
) {
  if (!chatReviewCaptureEnabled() || !isSessionId(sessionId) || !isTurnId(turnId)) return;
  try {
    const draft = (await readDraft(sessionId, turnId)) ?? emptyDraft();
    await writeDraft(sessionId, turnId, update(draft));
  } catch {
    // Capture is best-effort and never blocks the shopper's turn.
  }
}
