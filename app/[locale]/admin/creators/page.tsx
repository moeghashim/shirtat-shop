import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PerformanceTable, type PerformanceRow } from "@/components/admin/performance-table";
import { ChangePasswordForm } from "@/components/creators/forms";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import {
  adminDeleteAction,
  adminDesignAction,
  adminResendDetailsAction,
  adminUpdateAction,
  signOutAction,
} from "@/lib/creators/actions";
import { getSession } from "@/lib/creators/auth";
import { getCreatorEarnings, getOrderLines } from "@/lib/creators/earnings";
import { getProductType } from "@/lib/creators/product-types";
import { listCreators, listQueuedEmails } from "@/lib/creators/store";
import type { CreatorRecord } from "@/lib/creators/types";

export const metadata: Metadata = {
  title: "Creators admin",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  deleted: "Creator deleted.",
  handle: "Handle must be 2–39 characters: lowercase letters, numbers and hyphens.",
  needhandle: "Assign a handle before approving.",
  notfound: "Creator not found.",
  saved: "Saved.",
  shopify: "Shopify request failed. See the error on the design below.",
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

async function AdminContent({
  searchParams,
}: Pick<PageProps<"/[locale]/admin/creators">, "searchParams">) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/creators/signin");
  const params = await searchParams;
  const flag = ["saved", "deleted", "error"]
    .map((k) => (k === "error" ? params.error : params[k] ? k : undefined))
    .find(Boolean);
  const emailFlag = typeof params.email === "string" ? params.email : undefined;
  const message = emailFlag
    ? emailFlag === "sent"
      ? "Details email sent."
      : emailFlag === "queued"
        ? "Details email queued. It will be sent from moeg@mail.grokbot.com; the link is also shown below."
        : emailFlag === "not_configured"
          ? "Email provider not configured yet. A new link was generated; copy it below and send it manually."
          : "Email failed to send. A new link was generated; copy it below."
    : typeof flag === "string"
      ? MESSAGES[flag]
      : undefined;
  const [creators, queue] = await Promise.all([listCreators(), listQueuedEmails()]);
  const latestEmail = new Map(
    queue.filter((e) => e.status !== "cancelled").map((e) => [e.creatorId, e]),
  );
  const queuedCount = queue.filter((e) => e.status === "queued").length;
  const pending = creators.filter((c) => c.status === "pending").length;
  const field = "rounded-md border border-border bg-background px-2 py-1 text-sm";

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <strong>{pending}</strong> pending · {creators.length} total · {queuedCount} email(s)
          queued
        </p>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value="en" />
          <button className="text-sm underline cursor-pointer" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <Performance creators={creators} />
      {message && (
        <p className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm">{message}</p>
      )}
      <p className="text-sm text-muted-foreground">
        To link products to a creator, add the tag <code>creator:&lt;handle&gt;</code> to the
        product in Shopify admin.
      </p>
      {creators.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
      {creators.map((c) => (
        <article key={c.id} className="flex flex-col gap-3 rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {c.name} <span className="text-sm font-normal text-muted-foreground">{c.email}</span>
            </h2>
            <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium uppercase">
              {c.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {c.country} · applied {c.createdAt.slice(0, 10)} · payout {c.payoutMethod} ·{" "}
            {c.locale.toUpperCase()}
            {c.handle ? ` · @${c.handle}` : ""}
          </p>
          <p className="text-sm whitespace-pre-line">{c.bio}</p>
          <ul className="text-sm">
            {c.portfolioLinks.map((l) => (
              <li key={l}>
                <a
                  className="underline break-all"
                  href={l}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <details className="text-sm">
            <summary className="cursor-pointer">
              Application samples ({c.submissions.length})
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {c.submissions.map((s) => (
                <li key={s.createdAt} className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    {s.createdAt.slice(0, 16).replace("T", " ")} UTC {s.note && `· ${s.note}`}
                  </span>
                  {s.files.map((f) => (
                    <a
                      key={f.pathname}
                      className="underline"
                      href={`/api/creators/file?p=${encodeURIComponent(f.pathname)}`}
                      target="_blank"
                    >
                      {f.name}
                    </a>
                  ))}
                  {s.links.map((l) => (
                    <a
                      key={l}
                      className="underline break-all"
                      href={l}
                      rel="noopener noreferrer nofollow"
                      target="_blank"
                    >
                      {l}
                    </a>
                  ))}
                </li>
              ))}
            </ul>
          </details>
          {c.status === "approved" && (
            <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm">
              <p>
                <strong>Creator details:</strong>{" "}
                {c.details
                  ? `submitted ${c.details.submittedAt.slice(0, 10)}`
                  : "not submitted yet"}
                {" · "}
                <strong>Email:</strong>{" "}
                {c.detailsEmail
                  ? c.detailsEmail.status === "sent"
                    ? `sent ${c.detailsEmail.sentAt?.slice(0, 16).replace("T", " ")} UTC`
                    : c.detailsEmail.status === "queued"
                      ? latestEmail.get(c.id)?.status === "sent"
                        ? `sent from ${latestEmail.get(c.id)?.sentFrom ?? "Grok Bot inbox"} ${latestEmail.get(c.id)?.sentAt?.slice(0, 16).replace("T", " ")} UTC`
                        : `queued ${c.detailsEmail.sentAt?.slice(0, 16).replace("T", " ")} UTC (sent from moeg@mail.grokbot.com by routine)`
                      : c.detailsEmail.status === "not_configured"
                        ? "not sent (email provider not configured)"
                        : `failed (${c.detailsEmail.error ?? "error"})`
                  : "not sent"}
              </p>
              {c.details && (
                <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  <div>
                    <dt className="inline text-muted-foreground">Legal name: </dt>
                    <dd className="inline">{c.details.legalName}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">Display name: </dt>
                    <dd className="inline">{c.details.displayName}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">Payout: </dt>
                    <dd className="inline">
                      {c.details.payoutMethod} · {c.details.payoutEmail}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">Country: </dt>
                    <dd className="inline">
                      {c.details.country}
                      {c.details.taxId ? ` · tax ID ${c.details.taxId}` : ""}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="inline text-muted-foreground">Address: </dt>
                    <dd className="inline whitespace-pre-line">{c.details.address}</dd>
                  </div>
                  {c.details.wiseDetails && (
                    <div className="sm:col-span-2">
                      <dt className="inline text-muted-foreground">Wise: </dt>
                      <dd className="inline">{c.details.wiseDetails}</dd>
                    </div>
                  )}
                  {c.details.socialHandles && (
                    <div className="sm:col-span-2">
                      <dt className="inline text-muted-foreground">Social: </dt>
                      <dd className="inline">{c.details.socialHandles}</dd>
                    </div>
                  )}
                  {c.details.avatar && (
                    <div>
                      <a
                        className="underline"
                        href={`/api/creators/file?p=${encodeURIComponent(c.details.avatar.pathname)}`}
                        target="_blank"
                      >
                        Avatar
                      </a>
                    </div>
                  )}
                </dl>
              )}
              {!c.details && c.detailsLink && c.detailsToken && (
                <p className="break-all text-xs">
                  Fallback link (expires {c.detailsToken.expiresAt.slice(0, 10)}):{" "}
                  <code>{c.detailsLink}</code>
                </p>
              )}
              <form action={adminResendDetailsAction}>
                <input type="hidden" name="id" value={c.id} />
                <button className="underline cursor-pointer" type="submit">
                  {c.detailsEmail ? "Resend email (new link)" : "Send details email"}
                </button>
              </form>
            </div>
          )}
          {(c.designs?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2 text-sm">
              <h3 className="font-semibold">Uploaded designs</h3>
              {c.designs!.map((d) => {
                const type = getProductType(d.productTypeId);
                return (
                  <div
                    key={d.id}
                    className="flex flex-col gap-1 rounded-xl border border-border p-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{d.title}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Type:{" "}
                      <strong className="text-foreground">
                        {type?.labelEn ?? d.productTypeId}
                      </strong>{" "}
                      ({type?.productType}) · colours {d.colors.join(", ")} · sizes{" "}
                      {type?.sizes.join(", ")} · ${type?.basePrice}
                      {d.tags.length > 0 && ` · tags ${d.tags.join(", ")}`}
                    </p>
                    {d.descriptionEn && <p>{d.descriptionEn}</p>}
                    {d.descriptionAr && (
                      <p dir="rtl" lang="ar">
                        {d.descriptionAr}
                      </p>
                    )}
                    <p className="flex flex-wrap gap-3">
                      <a
                        className="underline"
                        href={`/api/creators/file?p=${encodeURIComponent(d.file.pathname)}`}
                        target="_blank"
                      >
                        Design file
                      </a>
                      {d.shopifyProductId && (
                        <a
                          className="underline"
                          href={`https://admin.shopify.com/store/shirtatco/products/${d.shopifyProductId.split("/").pop()}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Open in Shopify
                        </a>
                      )}
                    </p>
                    {d.error && <p className="text-red-700">Shopify: {d.error}</p>}
                    <div className="flex flex-wrap gap-2">
                      {!d.shopifyProductId && d.status !== "rejected" && (
                        <DesignButton
                          id={c.id}
                          designId={d.id}
                          op="draft"
                          label="Create Shopify draft"
                        />
                      )}
                      {d.shopifyProductId && d.status === "draft" && (
                        <DesignButton
                          id={c.id}
                          designId={d.id}
                          op="publish"
                          label="Publish to store"
                          primary
                        />
                      )}
                      {d.status !== "rejected" && d.status !== "published" && (
                        <DesignButton id={c.id} designId={d.id} op="reject" label="Reject" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <form action={adminUpdateAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={c.id} />
            <label className="flex flex-col gap-1 text-xs">
              Status
              <select name="status" defaultValue={c.status} className={field}>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Handle
              <input
                name="handle"
                defaultValue={c.handle ?? ""}
                placeholder="e.g. layla"
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Tier
              <select name="tierOverride" defaultValue={c.tierOverride} className={field}>
                <option value="auto">auto (15%, 20% at 50+ units/quarter)</option>
                <option value="standard">standard 15%</option>
                <option value="top">top 20%</option>
              </select>
            </label>
            <button
              className="rounded-full bg-foreground px-4 py-1.5 text-sm text-background cursor-pointer"
              type="submit"
            >
              Save
            </button>
          </form>
          <form
            action={adminDeleteAction}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <input type="hidden" name="id" value={c.id} />
            <label className="flex items-center gap-1">
              <input type="checkbox" name="confirm" value="delete" /> confirm
            </label>
            <button className="underline cursor-pointer" type="submit">
              Delete creator and uploads
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}

function DesignButton({
  designId,
  id,
  label,
  op,
  primary,
}: {
  designId: string;
  id: string;
  label: string;
  op: string;
  primary?: boolean;
}) {
  return (
    <form action={adminDesignAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="designId" value={designId} />
      <input type="hidden" name="op" value={op} />
      <button
        className={
          primary
            ? "rounded-full bg-foreground px-4 py-1.5 text-background cursor-pointer"
            : "rounded-full border border-border px-4 py-1.5 cursor-pointer"
        }
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}

const usd = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" });
const day = (iso?: string) => (iso ? iso.slice(0, 10) : "");

async function Performance({ creators }: { creators: CreatorRecord[] }) {
  const lines = await getOrderLines().catch(() => null);
  const rows: PerformanceRow[] = await Promise.all(
    creators.map(async (c) => {
      const e =
        c.status === "approved" && lines
          ? await getCreatorEarnings(c, lines).catch(() => null)
          : null;
      const designs = c.designs ?? [];
      return {
        designsLive: designs.filter((d) => d.status === "published").length,
        designsRejected: designs.filter((d) => d.status === "rejected").length,
        designsSubmitted: designs.length,
        earnings: e?.earnings ?? 0,
        handle: c.handle ?? "",
        id: c.id,
        lastSignIn: day(c.lastSignInAt),
        lastUpload: day(
          designs
            .map((d) => d.createdAt)
            .sort()
            .pop(),
        ),
        name: c.name,
        net60: e?.netSales ?? 0,
        netQtd: e?.quarterNet ?? 0,
        payable: e?.payable ?? 0,
        pending: e?.pending ?? 0,
        rate: e?.rate ?? 0,
        refunds: e?.refunds ?? 0,
        status: c.status,
        tier: e?.tier ?? "",
        units60: e?.units ?? 0,
        unitsQtd: e?.quarterUnits ?? 0,
      };
    }),
  );
  const sum = (k: keyof PerformanceRow) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const totals: [string, string][] = [
    ["Approved creators", String(creators.filter((c) => c.status === "approved").length)],
    ["Pending applications", String(creators.filter((c) => c.status === "pending").length)],
    ["Units (60 days)", String(sum("units60"))],
    ["Net sales (60 days)", usd.format(sum("net60"))],
    ["Net sales (QTD)", usd.format(sum("netQtd"))],
    ["Refunds", usd.format(sum("refunds"))],
    ["Owed to creators", usd.format(sum("earnings"))],
    ["Payable now", usd.format(sum("payable"))],
    ["Designs live", `${sum("designsLive")} of ${sum("designsSubmitted")}`],
  ];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-semibold">Performance</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {totals.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border p-3">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="text-lg font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {lines === null && (
        <p className="text-sm text-red-700">Sales data is unavailable right now; figures show 0.</p>
      )}
      {rows.length > 0 && <PerformanceTable rows={rows} />}
      <p className="text-xs text-muted-foreground">
        USD. Orders from the last 60 days (Shopify window); QTD is quarter-to-date within that
        window. Non-USD orders are converted at the order-date rate. Refunds are deducted. Pending =
        within the 30-day hold; payable = past it.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer">Change admin password</summary>
        <div className="mt-3 max-w-md">
          <ChangePasswordForm />
        </div>
      </details>
    </section>
  );
}
