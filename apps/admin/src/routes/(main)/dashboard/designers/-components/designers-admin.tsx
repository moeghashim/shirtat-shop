import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/blocks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { DesignersView } from "../../../../../../../../lib/admin-api/types.ts";
import { CreateFromDesign } from "./create-design";
import { CreatorCard } from "./creator-card";
import { Performance } from "./performance";
import type { ActionNotice } from "./use-designer-action";

const FILTERS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
] as const;

export function DesignersAdmin({ view }: { view: DesignersView }) {
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const shown = view.creators.filter((c) => filter === "all" || c.status === filter);
  const notify = (next: ActionNotice) => {
    setNotice(next);
    if (typeof window !== "undefined") window.scrollTo({ behavior: "smooth", top: 0 });
  };
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Designers"
        description={`${view.counts.pending} pending · ${view.counts.total} total · ${view.counts.queuedEmails} email(s) queued`}
        actions={
          <p className="flex flex-wrap gap-x-4 text-sm">
            <Link className="underline" to="/dashboard/chats">
              Review shopping chats
            </Link>
            <Link className="underline" to="/dashboard/seo">
              SEO plan
            </Link>
          </p>
        }
      />
      {notice ? (
        <Alert aria-live="polite" role="status" variant={notice.ok ? "default" : "destructive"}>
          <AlertTitle>{notice.ok ? "Done" : "Not done"}</AlertTitle>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      ) : null}
      <Performance view={view} />
      <CreateFromDesign notify={notify} view={view} />
      <p className="text-muted-foreground text-sm">
        To link products to a designer, add the tag <code>designer:&lt;handle&gt;</code> (legacy <code>creator:</code>{" "}
        still counts) to the product in Shopify admin. Designers apply and sign in on{" "}
        <a className="underline" href={`${view.storefrontUrl}/creators/apply`} rel="noopener" target="_blank">
          shirtat.co/creators
        </a>
        .
      </p>
      <section aria-labelledby="applications-heading" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium" id="applications-heading">
            Applications and designers
          </h2>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Show</legend>
            {FILTERS.map(([value, label]) => (
              <label className="flex min-h-6 items-center gap-1 text-sm" key={value}>
                <input
                  checked={filter === value}
                  className="accent-primary size-4"
                  name="creator-filter"
                  onChange={() => setFilter(value)}
                  type="radio"
                  value={value}
                />
                {label}
                {value === "pending" ? ` (${view.counts.pending})` : ""}
              </label>
            ))}
          </fieldset>
        </div>
        {view.creators.length === 0 ? <p className="text-muted-foreground">No applications yet.</p> : null}
        {view.creators.length > 0 && shown.length === 0 ? (
          <p className="text-muted-foreground">Nothing in this filter.</p>
        ) : null}
        {shown.map((creator) => (
          <CreatorCard catalog={view.catalog} creator={creator} key={creator.id} notify={notify} />
        ))}
      </section>
    </div>
  );
}
