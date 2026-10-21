import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { adminDeleteAction, adminUpdateAction, signOutAction } from "@/lib/creators/actions";
import { getSession } from "@/lib/creators/auth";
import { listCreators } from "@/lib/creators/store";

export const metadata: Metadata = { title: "Creators admin", robots: { index: false, follow: false } };

const MESSAGES: Record<string, string> = {
  deleted: "Creator deleted.",
  handle: "Handle must be 2–39 characters: lowercase letters, numbers and hyphens.",
  needhandle: "Assign a handle before approving.",
  notfound: "Creator not found.",
  saved: "Saved.",
  taken: "That handle is already used by another creator.",
};

export default function AdminCreatorsPage({ searchParams }: PageProps<"/[locale]/admin/creators">) {
  return (
    <Page>
      <Container className="max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-semibold">Creators admin</h1>
        <Suspense fallback={<p className="mt-6 text-muted-foreground">Loading…</p>}>
          <AdminContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </Page>
  );
}

async function AdminContent({ searchParams }: Pick<PageProps<"/[locale]/admin/creators">, "searchParams">) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/creators/signin");
  const params = await searchParams;
  const flag = ["saved", "deleted", "error"].map((k) => (k === "error" ? params.error : params[k] ? k : undefined)).find(Boolean);
  const message = typeof flag === "string" ? MESSAGES[flag] : undefined;
  const creators = await listCreators();
  const pending = creators.filter((c) => c.status === "pending").length;
  const field = "rounded-md border border-border bg-background px-2 py-1 text-sm";

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <strong>{pending}</strong> pending · {creators.length} total
        </p>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value="en" />
          <button className="text-sm underline cursor-pointer" type="submit">Sign out</button>
        </form>
      </div>
      {message && <p className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm">{message}</p>}
      <p className="text-sm text-muted-foreground">
        To link products to a creator, add the tag <code>creator:&lt;handle&gt;</code> to the product in Shopify admin.
      </p>
      {creators.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
      {creators.map((c) => (
        <article key={c.id} className="flex flex-col gap-3 rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {c.name} <span className="text-sm font-normal text-muted-foreground">{c.email}</span>
            </h2>
            <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium uppercase">{c.status}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {c.country} · applied {c.createdAt.slice(0, 10)} · payout {c.payoutMethod} · {c.locale.toUpperCase()}
            {c.handle ? ` · @${c.handle}` : ""}
          </p>
          <p className="text-sm whitespace-pre-line">{c.bio}</p>
          <ul className="text-sm">
            {c.portfolioLinks.map((l) => (
              <li key={l}><a className="underline break-all" href={l} rel="noopener noreferrer nofollow" target="_blank">{l}</a></li>
            ))}
          </ul>
          <details className="text-sm">
            <summary className="cursor-pointer">Designs ({c.submissions.length})</summary>
            <ul className="mt-2 flex flex-col gap-2">
              {c.submissions.map((s) => (
                <li key={s.createdAt} className="flex flex-col gap-1">
                  <span className="text-muted-foreground">{s.createdAt.slice(0, 16).replace("T", " ")} UTC {s.note && `· ${s.note}`}</span>
                  {s.files.map((f) => (
                    <a key={f.pathname} className="underline" href={`/api/creators/file?p=${encodeURIComponent(f.pathname)}`} target="_blank">{f.name}</a>
                  ))}
                  {s.links.map((l) => (
                    <a key={l} className="underline break-all" href={l} rel="noopener noreferrer nofollow" target="_blank">{l}</a>
                  ))}
                </li>
              ))}
            </ul>
          </details>
          <form action={adminUpdateAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={c.id} />
            <label className="flex flex-col gap-1 text-xs">Status
              <select name="status" defaultValue={c.status} className={field}>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">Handle
              <input name="handle" defaultValue={c.handle ?? ""} placeholder="e.g. layla" className={field} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Tier
              <select name="tierOverride" defaultValue={c.tierOverride} className={field}>
                <option value="auto">auto (15%, 20% at 50+ units/quarter)</option>
                <option value="standard">standard 15%</option>
                <option value="top">top 20%</option>
              </select>
            </label>
            <button className="rounded-full bg-foreground px-4 py-1.5 text-sm text-background cursor-pointer" type="submit">Save</button>
          </form>
          <form action={adminDeleteAction} className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="hidden" name="id" value={c.id} />
            <label className="flex items-center gap-1"><input type="checkbox" name="confirm" value="delete" /> confirm</label>
            <button className="underline cursor-pointer" type="submit">Delete creator and uploads</button>
          </form>
        </article>
      ))}
    </div>
  );
}
