import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { chatReviewCaptureEnabled, reviewAccess } from "@/lib/chat-review";
import { openReviewSessionAction } from "@/lib/chat-review/action";
import { listPointers, type StoredPointer } from "@/lib/chat-review/store";
import { getSession } from "@/lib/creators/auth";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Chat review",
};

export default function ChatReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={<ReviewFallback />}>
      <ChatReviewList searchParams={searchParams} />
    </Suspense>
  );
}

async function ChatReviewList({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  await connection();
  const session = await getSession();
  if (!reviewAccess(session)) redirect("/creators/signin");
  const params = await searchParams;
  let pointers: StoredPointer[] = [];
  let storeError = false;
  try {
    pointers = await listPointers();
  } catch {
    storeError = true;
  }
  const sessions = groupSessions(pointers);
  return (
    <Page>
      <Container className="max-w-3xl">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold">Chat review</h1>
            <p className="text-sm leading-6 text-foreground/80">
              Owner only. Transcripts are private. Saving feedback freezes the turn you are looking
              at and does not train the model.{" "}
              {chatReviewCaptureEnabled()
                ? "Automatic copies are on for this server because CHAT_REVIEW_CAPTURE is 1. Each copy is kept for 30 days and can be deleted here."
                : "Automatic copies of every chat are off. This list stays empty until you open a session and save a turn, or until capture is turned on after review."}{" "}
              Copies older than 30 days are removed when this list is opened. There is no background
              sweeper.
            </p>
            <p className="text-sm">
              <Link href="/admin/creators">Designers admin</Link>
              {" · "}
              <Link href="/admin/seo">SEO plan</Link>
            </p>
          </div>
          {params.deleted ? <p role="status">The stored copy was deleted.</p> : null}
          {params.error === "invalid" ? <p role="alert">That session id is not usable.</p> : null}
          {storeError ? (
            <p role="alert">The private store is not available from this server.</p>
          ) : null}
          <form action={openReviewSessionAction} className="grid gap-2">
            <label className="grid gap-1 text-sm" htmlFor="sessionId">
              Open a session id
              <input
                className="min-h-11 rounded-xl border border-border bg-background px-3"
                id="sessionId"
                name="sessionId"
                required
              />
            </label>
            <button
              className="min-h-11 cursor-pointer rounded-full bg-foreground px-4 text-background"
              type="submit"
            >
              Open
            </button>
          </form>
          <ul className="grid gap-3">
            {sessions.map((item) => (
              <li key={item.sessionId}>
                <Link
                  className="grid gap-1 rounded-2xl bg-[#f6f1e8] p-4"
                  href={`/admin/chats/${item.sessionId}`}
                >
                  <span className="break-all font-mono text-sm">{item.sessionId}</span>
                  <span
                    className="text-sm"
                    dir={item.direction}
                    lang={item.direction === "rtl" ? "ar" : "en"}
                  >
                    {item.preview}
                  </span>
                  <span className="text-xs text-foreground/70">
                    {item.turns} stored {item.turns === 1 ? "turn" : "turns"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!storeError && sessions.length === 0 ? (
            <p className="text-sm text-foreground/70">No stored transcripts.</p>
          ) : null}
        </div>
      </Container>
    </Page>
  );
}

function ReviewFallback() {
  return (
    <Page>
      <Container className="max-w-3xl">
        <p className="text-sm text-foreground/70" aria-busy="true">
          Loading chat review
        </p>
      </Container>
    </Page>
  );
}

function groupSessions(pointers: StoredPointer[]) {
  const grouped = new Map<
    string,
    { direction: StoredPointer["direction"]; preview: string; sessionId: string; turns: number }
  >();
  for (const pointer of pointers) {
    const current = grouped.get(pointer.sessionId);
    if (!current) {
      grouped.set(pointer.sessionId, {
        direction: pointer.direction,
        preview: pointer.preview,
        sessionId: pointer.sessionId,
        turns: 1,
      });
      continue;
    }
    current.turns += 1;
  }
  return [...grouped.values()];
}
