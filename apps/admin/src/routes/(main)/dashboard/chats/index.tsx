import { useState } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { DashboardCard, PageHeader, SectionHeader } from "@/components/blocks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { loadChats, requireOwnerRoute } from "./-components/functions";

const searchSchema = z.object({ deleted: z.string().optional(), error: z.string().optional() });

export const Route = createFileRoute("/(main)/dashboard/chats/")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: () => requireOwnerRoute(),
  loader: () => loadChats(),
  component: ChatsPage,
});

function ChatsPage() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [invalid, setInvalid] = useState(search.error === "invalid");
  const view = loaded.data;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Chat review"
        description="Owner only. Transcripts are private. Saving feedback freezes the turn you are looking at and does not train the model."
        actions={
          <Link className="text-sm underline" to="/dashboard/designers">
            Designers
          </Link>
        }
      />
      {loaded.error ? (
        <Alert variant="destructive">
          <AlertTitle>Chats did not load</AlertTitle>
          <AlertDescription>{loaded.error}</AlertDescription>
        </Alert>
      ) : null}
      {view ? (
        <p className="text-muted-foreground max-w-prose text-sm">
          {view.captureEnabled
            ? "Automatic copies are on for the storefront because CHAT_REVIEW_CAPTURE is 1. Each copy is kept for 30 days and can be deleted here."
            : "Automatic copies of every chat are off. This list stays empty until you open a session and save a turn, or until capture is turned on after review."}{" "}
          Copies older than 30 days are removed when this list is opened. There is no background sweeper.
        </p>
      ) : null}
      {search.deleted ? <p role="status">The stored copy was deleted.</p> : null}
      {invalid ? <p role="alert">That session id is not usable.</p> : null}
      {view?.storeError ? <p role="alert">The private store is not available from the storefront.</p> : null}
      <DashboardCard>
        <SectionHeader title="Open a session" description="Paste a chat session id from the storefront." />
        <CardContent>
          <form
            className="flex max-w-xl flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const value = String(new FormData(event.currentTarget).get("sessionId") ?? "").trim();
              if (!/^[A-Za-z0-9_-]{8,200}$/.test(value)) {
                setInvalid(true);
                return;
              }
              setInvalid(false);
              void navigate({ params: { sessionId: value }, to: "/dashboard/chats/$sessionId" });
            }}
          >
            <label className="grid min-w-64 flex-1 gap-1 text-sm" htmlFor="sessionId">
              Session id
              <Input id="sessionId" name="sessionId" required />
            </label>
            <Button type="submit">Open</Button>
          </form>
        </CardContent>
      </DashboardCard>
      {view ? (
        <section aria-labelledby="stored-heading" className="grid gap-3">
          <h2 className="text-lg font-medium" id="stored-heading">
            Stored chats ({view.sessions.length})
          </h2>
          {!view.storeError && view.sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No stored transcripts.</p>
          ) : null}
          <ul className="grid gap-3">
            {view.sessions.map((item) => (
              <li key={item.sessionId}>
                <DashboardCard density="compact">
                  <CardContent className="grid gap-1">
                    <Link
                      className="font-mono text-sm break-all underline"
                      params={{ sessionId: item.sessionId }}
                      to="/dashboard/chats/$sessionId"
                    >
                      {item.sessionId}
                    </Link>
                    <span className="text-sm" dir={item.direction} lang={item.direction === "rtl" ? "ar" : "en"}>
                      {item.preview}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.turns} stored {item.turns === 1 ? "turn" : "turns"}
                    </span>
                  </CardContent>
                </DashboardCard>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
