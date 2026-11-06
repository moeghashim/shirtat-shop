import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ChatTranscript } from "@/components/admin/chat-transcript";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import {
  type FrozenTurn,
  type ProjectedTurn,
  type TurnFeedback,
  isSessionId,
  reviewAccess,
  sealTurn,
} from "@/lib/chat-review";
import { deleteReviewSessionAction, saveReviewFeedbackAction } from "@/lib/chat-review/action";
import { readLiveTurns, reviewHost } from "@/lib/chat-review/live";
import { listPointers, readFeedback, readFrozenTurn } from "@/lib/chat-review/store";
import { getSession } from "@/lib/creators/auth";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Chat review",
};

const ERRORS: Record<string, string> = {
  invalid: "The feedback could not be saved.",
  mismatch:
    "The turn changed or could not be read again. Review the text above and save once more.",
};

export default function ChatReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ error?: string; fixture?: string; saved?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <Page>
          <Container className="max-w-3xl">
            <p className="text-sm text-foreground/70" aria-busy="true">
              Loading chat review
            </p>
          </Container>
        </Page>
      }
    >
      <ChatReviewDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ChatReviewDetail({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ error?: string; fixture?: string; saved?: string }>;
}) {
  await connection();
  const session = await getSession();
  if (!reviewAccess(session)) redirect("/creators/signin");
  const { sessionId } = await params;
  if (!isSessionId(sessionId)) redirect("/admin/chats?error=invalid");
  const query = await searchParams;
  if (query.fixture === "sample") return <SampleReview />;
  const live = await readLiveTurns(sessionId, await reviewHost());
  let stored: FrozenTurn[] = [];
  let feedback = new Map<string, TurnFeedback>();
  let storeError = false;
  try {
    const pointers = (await listPointers()).filter((pointer) => pointer.sessionId === sessionId);
    stored = (
      await Promise.all(
        pointers.map((pointer) => readFrozenTurn(sessionId, pointer.turnId, pointer.version)),
      )
    ).filter((turn): turn is FrozenTurn => turn !== null);
    const saved = await Promise.all(
      stored.map((turn) => readFeedback(sessionId, turn.turnId, turn.version)),
    );
    feedback = new Map(
      saved.flatMap((item) =>
        item ? [[`${item.turnId}:${item.turnVersion}`, item] as const] : [],
      ),
    );
  } catch {
    storeError = true;
  }
  const turns = mergeTurns(live ?? [], stored);
  return (
    <Page>
      <Container className="max-w-3xl">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <h1 className="break-all font-mono text-xl">{sessionId}</h1>
            <p className="text-sm leading-6 text-foreground/80">
              English and Arabic are rendered from the text itself. Includes and excludes checks run
              against the frozen assistant text only. Manual lines stay a rubric. Nothing here calls
              a judge model.
            </p>
            <p className="text-sm">
              <Link href="/admin/chats">All stored chats</Link>
            </p>
          </div>
          {query.saved ? <p role="status">Feedback saved on that turn version.</p> : null}
          {query.error && ERRORS[query.error] ? <p role="alert">{ERRORS[query.error]}</p> : null}
          {storeError ? (
            <p role="alert">The private store is not available from this server.</p>
          ) : null}
          {live === null ? (
            <p className="text-sm text-foreground/70">
              The live assistant session could not be read. A stored copy is shown when one exists.
            </p>
          ) : null}
          {turns.map((turn) => {
            const saved = feedback.get(`${turn.turn.turnId}:${turn.turn.version}`) ?? null;
            return (
              <section className="grid gap-4" key={`${turn.turn.turnId}:${turn.turn.version}`}>
                {turn.replaced ? (
                  <p className="text-sm">
                    Stored earlier version of this turn. Feedback stays on this exact text.
                  </p>
                ) : null}
                <ChatTranscript feedback={saved} turn={turn.turn} />
                <FeedbackForm feedback={saved} sessionId={sessionId} turn={turn.turn} />
                {saved ? (
                  <p className="text-sm">
                    <a
                      className="underline"
                      href={`/api/admin/chat-review/export?session=${encodeURIComponent(sessionId)}&turn=${encodeURIComponent(turn.turn.turnId)}&version=${turn.turn.version}`}
                    >
                      Export this version
                    </a>
                  </p>
                ) : (
                  <p className="text-sm text-foreground/70">
                    Export is available after feedback is saved on this exact version.
                  </p>
                )}
              </section>
            );
          })}
          {turns.length === 0 && !storeError ? (
            <p>No turns were found in the live session or in storage.</p>
          ) : null}
          <form action={deleteReviewSessionAction}>
            <input name="sessionId" type="hidden" value={sessionId} />
            <button
              className="min-h-11 cursor-pointer rounded-full border border-border px-4"
              type="submit"
            >
              Delete stored copy
            </button>
          </form>
        </div>
      </Container>
    </Page>
  );
}

function FeedbackForm({
  feedback,
  sessionId,
  turn,
}: {
  feedback: TurnFeedback | null;
  sessionId: string;
  turn: ProjectedTurn;
}) {
  const lines = (kind: TurnFeedback["checks"][number]["kind"]) =>
    feedback?.checks
      .filter((check) => check.kind === kind)
      .map((check) => check.text)
      .join("\n") ?? "";
  return (
    <form action={saveReviewFeedbackAction} className="grid gap-3">
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="turnId" type="hidden" value={turn.turnId} />
      <input name="turnVersion" type="hidden" value={turn.version} />
      <label className="grid gap-1 text-sm" htmlFor={`expected-${turn.version}`}>
        Expected behavior
        <textarea
          className="min-h-20 rounded-xl border border-border px-3 py-2 text-base"
          defaultValue={feedback?.expected ?? ""}
          id={`expected-${turn.version}`}
          name="expected"
        />
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`includes-${turn.version}`}>
        Pass if the assistant text includes each line
        <textarea
          className="min-h-16 rounded-xl border border-border px-3 py-2 text-base"
          defaultValue={lines("includes")}
          id={`includes-${turn.version}`}
          name="includes"
        />
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`excludes-${turn.version}`}>
        Fail if the assistant text includes each line
        <textarea
          className="min-h-16 rounded-xl border border-border px-3 py-2 text-base"
          defaultValue={lines("excludes")}
          id={`excludes-${turn.version}`}
          name="excludes"
        />
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`manual-${turn.version}`}>
        Manual rubric, one line each, not graded by the export
        <textarea
          className="min-h-16 rounded-xl border border-border px-3 py-2 text-base"
          defaultValue={lines("manual")}
          id={`manual-${turn.version}`}
          name="manual"
        />
      </label>
      <fieldset className="grid gap-2 text-sm">
        <legend>Owner verdict</legend>
        {(["ungraded", "pass", "fail"] as const).map((verdict) => (
          <label className="flex min-h-11 items-center gap-2" key={verdict}>
            <input
              defaultChecked={(feedback?.verdict ?? "ungraded") === verdict}
              name="verdict"
              type="radio"
              value={verdict}
            />
            {verdict}
          </label>
        ))}
      </fieldset>
      <button
        className="min-h-11 cursor-pointer rounded-full bg-foreground px-4 text-background"
        type="submit"
      >
        Save feedback
      </button>
    </form>
  );
}

function SampleReview() {
  const english = sealTurn("turn_en", {
    assistant: "The Ana Ibn Jala hoodie is $64.99.",
    modelId: "gpt-6-luna",
    shopper: "Which hoodie works as a gift?",
  });
  const arabic = sealTurn("turn_ar", {
    assistant: "تيشيرت تفكّر سعره 33.99 دولار.",
    modelId: "gpt-6-luna",
    shopper: "أريد هدية بخط عربي",
  });
  if (!english || !arabic) return null;
  const feedback: TurnFeedback = {
    checks: [
      { kind: "includes", text: "$64.99" },
      { kind: "excludes", text: "checkout" },
      { kind: "manual", text: "The reply names one product" },
    ],
    expected: "Name one gift and its price.",
    savedAt: "2026-11-06T00:00:00.000Z",
    sessionId: "sample-layout",
    turnId: english.turnId,
    turnVersion: english.version,
    verdict: "pass",
  };
  return (
    <Page>
      <Container className="max-w-3xl">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <h1 className="text-xl font-semibold">Sample layout</h1>
            <p className="text-sm leading-6 text-foreground/80">
              This is not a shopper transcript. Nothing on this page is stored. English and Arabic
              are rendered from the text itself, and the checks below are a sample rubric.
            </p>
            <p className="text-sm">
              <Link href="/admin/chats">All stored chats</Link>
            </p>
          </div>
          <ChatTranscript feedback={feedback} turn={english} />
          <FeedbackForm feedback={feedback} sessionId="sample-layout" turn={english} />
          <ChatTranscript feedback={null} turn={arabic} />
        </div>
      </Container>
    </Page>
  );
}

function mergeTurns(live: ProjectedTurn[], stored: FrozenTurn[]) {
  const liveIds = new Set(live.map((turn) => turn.turnId));
  const rows: { replaced: boolean; turn: ProjectedTurn }[] = [];
  for (const turn of live) {
    rows.push({ replaced: false, turn });
    for (const previous of stored) {
      if (previous.turnId === turn.turnId && previous.version !== turn.version) {
        rows.push({ replaced: true, turn: previous });
      }
    }
  }
  for (const turn of stored) {
    if (liveIds.has(turn.turnId)) continue;
    rows.push({ replaced: false, turn });
  }
  return rows;
}
