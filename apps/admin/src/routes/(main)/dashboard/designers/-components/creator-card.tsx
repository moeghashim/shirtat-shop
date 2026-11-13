import { DashboardCard, SectionHeader } from "@/components/blocks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { AdminCreator, AdminDesign, DesignersView } from "../../../../../../../../lib/admin-api/types.ts";
import { CategorySelect, ProductPicks, SupplierNote } from "./product-picks";
import { type ActionNotice, fileUrl, shopifyAdminUrl, stamp, useDesignerAction } from "./use-designer-action";

type Notify = (notice: ActionNotice) => void;

function statusVariant(status: string) {
  if (status === "approved" || status === "published") return "default" as const;
  if (status === "rejected" || status === "failed") return "destructive" as const;
  return "secondary" as const;
}

function avatarNote(c: AdminCreator): string {
  if (c.avatar) return `${c.avatar.kind === "logo" ? "Logo" : "Profile picture"} uploaded`;
  if (c.avatarPath) return "Avatar from details form";
  return "No logo or picture yet (initials shown)";
}

function emailLine(c: AdminCreator): string {
  const e = c.detailsEmail;
  if (!e) return "not sent";
  if (e.status === "sent") return `sent ${stamp(e.sentAt)}`;
  if (e.status === "queued") {
    if (c.latestEmail?.status === "sent")
      return `sent from ${c.latestEmail.sentFrom ?? "Grok Bot inbox"} ${stamp(c.latestEmail.sentAt)}`;
    return `queued ${stamp(e.sentAt)} (fallback queue; email provider not configured or failed)${e.error ? ` – ${e.error}` : ""}`;
  }
  if (e.status === "not_configured") return "not sent (email provider not configured)";
  return `failed (${e.error ?? "error"})`;
}

export function CreatorCard({
  creator: c,
  catalog,
  notify,
}: {
  creator: AdminCreator;
  catalog: DesignersView["catalog"];
  notify: Notify;
}) {
  const { pending, submit } = useDesignerAction(notify);
  const titleId = `creator-${c.id}`;
  return (
    <DashboardCard aria-labelledby={titleId}>
      <SectionHeader
        id={titleId}
        title={
          <span className="flex items-center gap-3">
            <Avatar size="lg">
              {c.avatarPath ? <AvatarImage alt="" src={fileUrl(c.avatarPath)} /> : null}
              <AvatarFallback>{c.initials}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              {c.name} <span className="text-muted-foreground text-sm font-normal break-all">{c.email}</span>
            </span>
          </span>
        }
        description={avatarNote(c)}
        actions={<Badge variant={statusVariant(c.status)}>{c.status}</Badge>}
      />
      <CardContent className="grid gap-4 text-sm">
        <p className="text-muted-foreground">
          {c.country} · applied {c.createdAt.slice(0, 10)} · payout {c.payoutMethod} · {c.locale.toUpperCase()}
          {c.handle ? ` · @${c.handle}` : ""}
        </p>
        {c.bio ? (
          <p className="whitespace-pre-line" dir="auto">
            {c.bio}
          </p>
        ) : null}
        {c.portfolioLinks.length ? (
          <ul className="grid gap-1">
            {c.portfolioLinks.map((link) => (
              <li key={link}>
                <a className="break-all underline" href={link} rel="noopener noreferrer nofollow" target="_blank">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <details>
          <summary className="cursor-pointer">Application samples ({c.submissions.length})</summary>
          <ul className="mt-2 grid gap-2">
            {c.submissions.map((s) => (
              <li key={s.createdAt} className="flex flex-col gap-1">
                <span className="text-muted-foreground">
                  {stamp(s.createdAt)} {s.note && `· ${s.note}`}
                </span>
                {s.files.map((f) => (
                  <a className="underline" href={fileUrl(f.pathname)} key={f.pathname} rel="noopener" target="_blank">
                    {f.name}
                  </a>
                ))}
                {s.links.map((l) => (
                  <a
                    className="break-all underline"
                    href={l}
                    key={l}
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
        {c.status === "approved" ? <DesignerDetails creator={c} notify={notify} /> : null}
        {c.designs.length ? (
          <div className="grid gap-2">
            <h3 className="font-medium">Uploaded designs</h3>
            {c.designs.map((d) => (
              <DesignPanel catalog={catalog} creator={c} design={d} key={d.id} notify={notify} />
            ))}
          </div>
        ) : null}
        <form className="flex flex-wrap items-end gap-3 border-t pt-4" onSubmit={submit("update", { id: c.id })}>
          <label className="grid gap-1 text-xs" htmlFor={`${c.id}-status`}>
            Status
            <NativeSelect defaultValue={c.status} id={`${c.id}-status`} name="status">
              <NativeSelectOption value="pending">pending</NativeSelectOption>
              <NativeSelectOption value="approved">approved</NativeSelectOption>
              <NativeSelectOption value="rejected">rejected</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="grid gap-1 text-xs" htmlFor={`${c.id}-handle`}>
            Handle
            <Input defaultValue={c.handle ?? ""} id={`${c.id}-handle`} name="handle" placeholder="e.g. layla" />
          </label>
          <label className="grid gap-1 text-xs" htmlFor={`${c.id}-tier`}>
            Tier
            <NativeSelect defaultValue={c.tierOverride} id={`${c.id}-tier`} name="tierOverride">
              <NativeSelectOption value="auto">auto (15%, 20% at 50+ units/quarter)</NativeSelectOption>
              <NativeSelectOption value="standard">standard 15%</NativeSelectOption>
              <NativeSelectOption value="top">top 20%</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="flex min-h-8 items-center gap-2 text-xs">
            <input
              className="accent-primary size-4"
              defaultChecked={c.hiddenFromDirectory}
              name="hidden"
              type="checkbox"
            />
            hide from /designers
          </label>
          <Button disabled={pending} type="submit">
            {pending ? "Saving" : "Save"}
          </Button>
        </form>
        <form
          className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs"
          onSubmit={submit("delete", { id: c.id })}
        >
          <label className="flex min-h-6 items-center gap-1">
            <input className="accent-primary size-4" name="confirm" type="checkbox" value="delete" /> confirm
          </label>
          <Button disabled={pending} size="sm" type="submit" variant="destructive">
            Delete designer and uploads
          </Button>
        </form>
      </CardContent>
    </DashboardCard>
  );
}

function DesignerDetails({ creator: c, notify }: { creator: AdminCreator; notify: Notify }) {
  const { pending, submit } = useDesignerAction(notify);
  const d = c.details;
  return (
    <div className="bg-muted/50 grid gap-2 rounded-lg p-3">
      <p>
        <strong>Designer details:</strong> {d ? `submitted ${d.submittedAt.slice(0, 10)}` : "not submitted yet"}
        {" · "}
        <strong>Email:</strong> {emailLine(c)}
      </p>
      {d ? (
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <Detail label="Legal name" value={d.legalName} />
          <Detail label="Display name" value={d.displayName} />
          <Detail label="Payout" value={`${d.payoutMethod} · ${d.payoutEmail}`} />
          <Detail label="Country" value={`${d.country}${d.taxId ? ` · tax ID ${d.taxId}` : ""}`} />
          <Detail className="sm:col-span-2 whitespace-pre-line" label="Address" value={d.address} />
          {d.wiseDetails ? <Detail className="sm:col-span-2" label="Wise" value={d.wiseDetails} /> : null}
          {d.socialHandles ? <Detail className="sm:col-span-2" label="Social" value={d.socialHandles} /> : null}
          {d.avatar ? (
            <div>
              <a className="underline" href={fileUrl(d.avatar.pathname)} rel="noopener" target="_blank">
                Avatar
              </a>
            </div>
          ) : null}
        </dl>
      ) : null}
      {!d && c.detailsLink && c.detailsTokenExpiresAt ? (
        <p className="text-xs break-all">
          Fallback link (expires {c.detailsTokenExpiresAt.slice(0, 10)}): <code>{c.detailsLink}</code>
        </p>
      ) : null}
      <form onSubmit={submit("resend", { id: c.id })}>
        <Button disabled={pending} size="sm" type="submit" variant="outline">
          {c.detailsEmail ? "Resend email (new link)" : "Send details email"}
        </Button>
      </form>
    </div>
  );
}

function Detail({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground inline">{label}: </dt>
      <dd className="inline" dir="auto">
        {value}
      </dd>
    </div>
  );
}

function DesignPanel({
  catalog,
  creator: c,
  design: d,
  notify,
}: {
  catalog: DesignersView["catalog"];
  creator: AdminCreator;
  design: AdminDesign;
  notify: Notify;
}) {
  const { pending, submit } = useDesignerAction(notify);
  const canPublish = (d.shopifyProductId || d.applied?.some((a) => a.status === "draft")) && d.status === "draft";
  return (
    <div className="grid gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium" dir="auto">
          {d.title}
        </span>
        <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
      </div>
      <p className="text-muted-foreground">
        Designer hint: <strong className="text-foreground">{d.typeLabel ?? "none"}</strong>
        {d.colors.length > 0 && ` · colours ${d.colors.join(", ")}`}
        {d.tags.length > 0 && ` · tags ${d.tags.join(", ")}`}
      </p>
      {d.descriptionEn ? <p>{d.descriptionEn}</p> : null}
      {d.descriptionAr ? (
        <p dir="rtl" lang="ar">
          {d.descriptionAr}
        </p>
      ) : null}
      <p className="flex flex-wrap gap-3">
        <a className="underline" href={fileUrl(d.file.pathname)} rel="noopener" target="_blank">
          Design file
        </a>
        {d.shopifyProductId ? (
          <a className="underline" href={shopifyAdminUrl(d.shopifyProductId)} rel="noopener noreferrer" target="_blank">
            Open in Shopify
          </a>
        ) : null}
      </p>
      {d.error ? <p className="text-destructive">Shopify: {d.error}</p> : null}
      {d.applied?.length ? (
        <ul className="text-xs">
          {d.applied.map((a) => (
            <li key={`${a.typeId}:${a.shopifyProductId ?? a.printifyProductId ?? a.colors.join("+")}:${a.status}`}>
              {a.typeId} · {a.colors.join(", ")} · ${a.price} · {a.status}
              {a.shopifyProductId ? (
                <>
                  {" · "}
                  <a
                    className="underline"
                    href={shopifyAdminUrl(a.shopifyProductId)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Shopify
                  </a>
                </>
              ) : null}
              {a.error ? <span className="text-destructive"> · {a.error}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {d.status !== "rejected" && c.handle ? (
        <details className="bg-muted/40 rounded-lg p-2" open={!d.applied?.length && !d.shopifyProductId}>
          <summary className="cursor-pointer font-medium">Apply design to products</summary>
          <form className="mt-2 grid gap-2" onSubmit={submit("apply", { designId: d.id, id: c.id })}>
            <label className="grid gap-1 text-xs" htmlFor={`${d.id}-title`}>
              Title
              <Input defaultValue={d.title} id={`${d.id}-title`} name="title" />
            </label>
            <CategorySelect
              catalog={catalog}
              id={`${d.id}-category`}
              matched={d.suggestedFrom}
              suggested={d.suggestedCategoryId}
            />
            <ProductPicks catalog={catalog} hintColors={d.colors} hintTypeId={d.productTypeId} idPrefix={d.id} />
            <SupplierNote supplier={catalog.supplierName} />
            <div>
              <Button disabled={pending} type="submit">
                {pending ? "Creating drafts" : "Create Shopify drafts"}
              </Button>
            </div>
          </form>
        </details>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canPublish ? (
          <form onSubmit={submit("design", { designId: d.id, id: c.id, op: "publish" })}>
            <Button disabled={pending} type="submit">
              Publish to store
            </Button>
          </form>
        ) : null}
        {d.status !== "rejected" && d.status !== "published" ? (
          <form onSubmit={submit("design", { designId: d.id, id: c.id, op: "reject" })}>
            <Button disabled={pending} type="submit" variant="outline">
              Reject
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
