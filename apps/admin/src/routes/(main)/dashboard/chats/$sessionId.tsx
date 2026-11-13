import { useState } from "react";

import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";

import { z } from "zod";

import { DashboardCard, PageHeader, SectionHeader } from "@/components/blocks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import type { ChatTurnView } from "../../../../../../../lib/admin-api/types.ts";
import { loadChatDetail, requireOwnerRoute, runChatAction } from "./-components/functions";
import { Transcript } from "./-components/transcript";

const searchSchema = z.object({ fixture: z.string().optional() });

const ERRORS: Record<string, string> = {
  failed: "The storefront did not save the feedback.",
  invalid: "The feedback could not be saved.",
  mismatch: "The turn changed or could not be read again. Review the text above and save once more.",
};

export const Route = createFileRoute("/(main)/dashboard/chats/$sessionId")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: () => requireOwnerRoute(),
  loaderDeps: ({ search }) => ({ fixture: search.fixture }),
  loader: ({ params, deps }) =>
    /^[A-Za-z0-9_-]{8,200}$/.test(params.sessionId)
      ? loadChatDetail({ data: { fixture: deps.fixture, sessionId: params.sessionId } })
      : Promise.resolve({ data: null, error: "That session id is not usable." }),
  component: ChatDetailPage,
});

function ChatDetailPage() {
  const loaded = Route.useLoaderData();
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const view = loaded.data;
  return (
    <div className="grid gap-6">
      <PageHeader
        title={view?.sample ? "Sample layout" : "Chat transcript"}
        description={
          view?.sample
            ? "This is not a shopper transcript. Nothing on this page is stored."
            : "English and Arabic are rendered from the text itself. Includes and excludes checks run against the frozen assistant text only. Manual lines stay a rubric. Nothing here calls a judge model."
        }
        actions={
          <Link className="text-sm underline" to="/dashboard/chats">
            All stored chats
          </Link>
        }
      />
      <p className="font-mono text-sm break-all">{sessionId}</p>
      {loaded.error ? (
        <Alert variant="destructive">
          <AlertTitle>Transcript did not load</AlertTitle>
          <AlertDescription>{loaded.error}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <p role={notice.ok ? "status" : "alert"} className={notice.ok ? undefined : "text-destructive"}>
          {notice.text}
        </p>
      ) : null}
      {view?.storeError ? <p role="alert">The private store is not available from the storefront.</p> : null}
      {view?.liveUnavailable ? (
        <p className="text-muted-foreground text-sm">
          The live assistant session could not be read. A stored copy is shown when one exists.
        </p>
      ) : null}
      {view?.turns.map((turn) => (
        <TurnCard
          key={`${turn.turn.turnId}:${turn.turn.version}`}
          onSaved={setNotice}
          sample={view.sample}
          sessionId={view.sessionId}
          turn={turn}
        />
      ))}
      {view && view.turns.length === 0 && !view.storeError ? (
        <p>No turns were found in the live session or in storage.</p>
      ) : null}
      {view && !view.sample ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData();
            form.set("_op", "delete");
            form.set("sessionId", view.sessionId);
            setDeleting(true);
            void runChatAction({ data: form })
              .then((result) =>
                result.ok
                  ? navigate({ search: { deleted: "1" }, to: "/dashboard/chats" })
                  : setNotice({ ok: false, text: "The stored copy was not deleted." }),
              )
              .finally(() => setDeleting(false));
          }}
        >
          <Button disabled={deleting} type="submit" variant="outline">
            Delete stored copy
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function TurnCard({
  onSaved,
  sample,
  sessionId,
  turn,
}: {
  onSaved: (notice: { ok: boolean; text: string }) => void;
  sample: boolean;
  sessionId: string;
  turn: ChatTurnView;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { feedback } = turn;
  const id = turn.turn.version.slice(0, 12);
  const lines = (kind: "excludes" | "includes" | "manual") =>
    feedback?.checks
      .filter((check) => check.kind === kind)
      .map((check) => check.text)
      .join("\n") ?? "";
  return (
    <DashboardCard>
      <SectionHeader
        level={2}
        title={turn.replaced ? "Stored earlier version of this turn" : "Turn"}
        description={turn.replaced ? "Feedback stays on this exact text." : undefined}
      />
      <CardContent className="grid gap-6">
        <Transcript view={turn} />
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (sample) return;
            const form = new FormData(event.currentTarget);
            form.set("_op", "feedback");
            setPending(true);
            void runChatAction({ data: form })
              .then((result) => {
                onSaved(
                  result.ok
                    ? { ok: true, text: "Feedback saved on that turn version." }
                    : { ok: false, text: ERRORS[result.code] ?? ERRORS.invalid },
                );
                return router.invalidate();
              })
              .finally(() => setPending(false));
          }}
        >
          <input name="sessionId" type="hidden" value={sessionId} />
          <input name="turnId" type="hidden" value={turn.turn.turnId} />
          <input name="turnVersion" type="hidden" value={turn.turn.version} />
          <label className="grid gap-1 text-sm" htmlFor={`expected-${id}`}>
            Expected behavior
            <Textarea defaultValue={feedback?.expected ?? ""} id={`expected-${id}`} name="expected" />
          </label>
          <label className="grid gap-1 text-sm" htmlFor={`includes-${id}`}>
            Pass if the assistant text includes each line
            <Textarea defaultValue={lines("includes")} id={`includes-${id}`} name="includes" />
          </label>
          <label className="grid gap-1 text-sm" htmlFor={`excludes-${id}`}>
            Fail if the assistant text includes each line
            <Textarea defaultValue={lines("excludes")} id={`excludes-${id}`} name="excludes" />
          </label>
          <label className="grid gap-1 text-sm" htmlFor={`manual-${id}`}>
            Manual rubric, one line each, not graded by the export
            <Textarea defaultValue={lines("manual")} id={`manual-${id}`} name="manual" />
          </label>
          <fieldset className="grid gap-2 text-sm">
            <legend>Owner verdict</legend>
            {(["ungraded", "pass", "fail"] as const).map((verdict) => (
              <label className="flex min-h-6 items-center gap-2" key={verdict}>
                <input
                  className="accent-primary size-4"
                  defaultChecked={(feedback?.verdict ?? "ungraded") === verdict}
                  name="verdict"
                  type="radio"
                  value={verdict}
                />
                {verdict}
              </label>
            ))}
          </fieldset>
          <div>
            <Button disabled={pending || sample} type="submit">
              {pending ? "Saving" : "Save feedback"}
            </Button>
          </div>
        </form>
        {feedback && !sample ? (
          <p className="text-sm">
            <a
              className="underline"
              href={`/api/chats/export?session=${encodeURIComponent(sessionId)}&turn=${encodeURIComponent(turn.turn.turnId)}&version=${turn.turn.version}`}
            >
              Export this version
            </a>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Export is available after feedback is saved on this exact version.
          </p>
        )}
      </CardContent>
    </DashboardCard>
  );
}
