import { suggestCategory } from "@/lib/catalog/categorize";
import { SUPPLIER, SUPPLIER_CATALOG, baseCost, retailPrice } from "@/lib/catalog/pricing";
import { CATEGORIES, getCategory } from "@/lib/collections/categories";
import { getCreatorEarnings, getOrderLines } from "@/lib/creators/earnings";
import { sendApprovalEmail } from "@/lib/creators/email";
import { PRODUCT_TYPES, getProductType } from "@/lib/creators/product-types";
import { archiveProduct, createDraftProduct, publishProduct } from "@/lib/creators/shopify-admin";
import {
  deleteCreatorAndUser,
  deleteQueuedEmails,
  getCreator,
  listCreators,
  listQueuedEmails,
  newId,
  uploadDesignFile,
  saveCreator,
} from "@/lib/creators/store";
import { issueDetailsToken, siteUrl } from "@/lib/creators/tokens";
import type { CreatorRecord, DesignRecord, TierOverride } from "@/lib/creators/types";
import { avatarOf, initialsOf } from "@/lib/designers/server";

import type {
  AdminActionResult,
  AdminCreator,
  DesignerOp,
  DesignersView,
  PerformanceRow,
} from "./types";

/**
 * Owner-only designer administration. Called only from the signed /api/internal/admin routes;
 * the admin app (admin.shirtat.co) is the UI. Logic and behaviour match the former
 * storefront /admin/creators page and its server actions.
 */

const DESIGN_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg"];

function str(form: FormData, key: string, max = 2000): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function ok(code: string, detail?: string): AdminActionResult {
  return detail ? { code, detail, ok: true } : { code, ok: true };
}

function fail(code: string, detail?: string): AdminActionResult {
  return detail ? { code, detail, ok: false } : { code, ok: false };
}

const day = (iso?: string) => (iso ? iso.slice(0, 10) : "");

async function performance(
  creators: CreatorRecord[],
): Promise<{ rows: PerformanceRow[]; salesUnavailable: boolean }> {
  const lines = await getOrderLines().catch(() => null);
  const rows = await Promise.all(
    creators.map(async (c): Promise<PerformanceRow> => {
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
  return { rows, salesUnavailable: lines === null };
}

/** Everything the Designers page renders, in one read. No writes. */
export async function readDesignersView(): Promise<DesignersView> {
  const [creators, queue] = await Promise.all([listCreators(), listQueuedEmails()]);
  const latestEmail = new Map(
    queue.filter((e) => e.status !== "cancelled").map((e) => [e.creatorId, e]),
  );
  const view: AdminCreator[] = creators.map(({ designs, detailsToken, ...c }) => {
    const latest = latestEmail.get(c.id);
    const avatar = avatarOf({ ...c, designs, detailsToken });
    return {
      ...c,
      avatarPath: avatar?.pathname ?? null,
      designs: (designs ?? []).map((d) => {
        const guess = suggestCategory(
          [d.title, d.descriptionEn, d.descriptionAr, ...d.tags].join(" "),
        );
        return {
          ...d,
          suggestedCategoryId: d.categoryId ?? guess.categoryId,
          suggestedFrom: guess.matched,
          typeLabel: getProductType(d.productTypeId)?.labelEn ?? null,
        };
      }),
      detailsTokenExpiresAt: detailsToken?.expiresAt ?? null,
      initials: initialsOf(c.details?.displayName || c.name),
      latestEmail: latest
        ? {
            sentAt: latest.sentAt ?? null,
            sentFrom: latest.sentFrom ?? null,
            status: latest.status,
          }
        : null,
    };
  });
  return {
    catalog: {
      categories: CATEGORIES.map((c) => ({ id: c.id, labelAr: c.labelAr, labelEn: c.labelEn })),
      productTypes: PRODUCT_TYPES.map((t) => {
        const cost = baseCost(t.id) ?? 0;
        return {
          blueprint: SUPPLIER_CATALOG[t.id]?.blueprint ?? null,
          colors: t.colors.map((c) => c.en),
          cost,
          id: t.id,
          labelEn: t.labelEn,
          retail: retailPrice(cost),
        };
      }),
      supplierName: SUPPLIER.name,
    },
    counts: {
      approved: creators.filter((c) => c.status === "approved").length,
      pending: creators.filter((c) => c.status === "pending").length,
      queuedEmails: queue.filter((e) => e.status === "queued").length,
      total: creators.length,
    },
    creators: view,
    performance: await performance(creators),
    storefrontUrl: siteUrl(),
  };
}

/** Issues a fresh details link, emails it (when a provider is configured) and records the result. */
async function sendDetailsLink(creator: CreatorRecord): Promise<string> {
  const link = issueDetailsToken(creator);
  const result = await sendApprovalEmail(creator, link);
  creator.detailsEmail = { ...result, sentAt: new Date().toISOString() };
  creator.detailsLink = link;
  return link;
}

async function update(form: FormData): Promise<AdminActionResult> {
  const creator = await getCreator(str(form, "id", 80));
  if (!creator) return fail("notfound");
  const status = str(form, "status", 20);
  const tier = str(form, "tierOverride", 20) as TierOverride;
  const handle = str(form, "handle", 40).toLowerCase();
  if (handle && !/^[a-z0-9][a-z0-9-]{1,38}$/.test(handle)) return fail("handle");
  if (handle === "shirtat") return fail("taken");
  if (handle && handle !== creator.handle) {
    const taken = (await listCreators()).some((c) => c.id !== creator.id && c.handle === handle);
    if (taken) return fail("taken");
  }
  if (status === "approved" && !handle && !creator.handle) return fail("needhandle");
  if (status === "pending" || status === "approved" || status === "rejected") {
    if (status !== creator.status) creator.reviewedAt = new Date().toISOString();
    creator.status = status;
  }
  if (tier === "auto" || tier === "standard" || tier === "top") creator.tierOverride = tier;
  if (handle) creator.handle = handle;
  creator.hiddenFromDirectory = form.get("hidden") === "on";
  const newlyApproved = creator.status === "approved" && !creator.detailsEmail && !creator.details;
  if (newlyApproved) await sendDetailsLink(creator);
  await saveCreator(creator);
  return newlyApproved
    ? ok("saved", `email ${creator.detailsEmail?.status ?? "failed"}`)
    : ok("saved");
}

async function remove(form: FormData): Promise<AdminActionResult> {
  const creator = await getCreator(str(form, "id", 80));
  if (!creator) return fail("notfound");
  if (form.get("confirm") !== "delete") return fail("confirm");
  await deleteQueuedEmails(creator.id);
  await deleteCreatorAndUser(creator);
  return ok("deleted");
}

async function resend(form: FormData): Promise<AdminActionResult> {
  const creator = await getCreator(str(form, "id", 80));
  if (!creator || creator.status !== "approved") return fail("notfound");
  await sendDetailsLink(creator);
  await saveCreator(creator);
  const status = creator.detailsEmail?.status ?? "failed";
  return { code: `email:${status}`, ok: status === "sent" || status === "queued" };
}

async function findDesign(form: FormData) {
  const creator = await getCreator(str(form, "id", 80));
  const design = creator?.designs?.find((d) => d.id === str(form, "designId", 80));
  return creator && design ? { creator, design } : null;
}

async function createDraft(creator: CreatorRecord, design: DesignRecord): Promise<void> {
  try {
    const product = await createDraftProduct(creator, design);
    design.shopifyProductId = product.id;
    design.shopifyProductHandle = product.handle;
    design.status = "draft";
    design.error = undefined;
  } catch (e) {
    design.error = e instanceof Error ? e.message : "Could not create the Shopify draft";
  }
  design.updatedAt = new Date().toISOString();
}

async function designOp(form: FormData): Promise<AdminActionResult> {
  const found = await findDesign(form);
  if (!found) return fail("notfound");
  const { creator, design } = found;
  const op = str(form, "op", 20);
  let result = "saved";
  try {
    if (op === "draft" && !design.shopifyProductId) {
      await createDraft(creator, design);
      if (design.error) result = "shopify";
    } else if (op === "publish" && design.applied?.some((a) => a.shopifyProductId)) {
      for (const a of design.applied) {
        if (a.shopifyProductId && a.status === "draft") {
          await publishProduct(a.shopifyProductId);
          a.status = "published";
        }
      }
      design.status = "published";
      design.error = undefined;
    } else if (op === "publish" && design.shopifyProductId) {
      await publishProduct(design.shopifyProductId);
      design.status = "published";
      design.error = undefined;
    } else if (op === "reject") {
      if (design.shopifyProductId) await archiveProduct(design.shopifyProductId);
      for (const a of design.applied ?? []) {
        if (a.shopifyProductId && a.status !== "published") {
          await archiveProduct(a.shopifyProductId);
          a.status = "rejected";
        }
      }
      design.status = "rejected";
      design.error = undefined;
    }
  } catch (e) {
    design.error = e instanceof Error ? e.message : "Shopify request failed";
    result = "shopify";
  }
  design.updatedAt = new Date().toISOString();
  await saveCreator(creator);
  return result === "saved" ? ok("saved") : fail("shopify");
}

/** Reads the owner's product picks: checked `types` plus `colors:<typeId>` per type. */
function readPicks(form: FormData): { colors: string[]; typeId: string }[] {
  return form
    .getAll("types")
    .filter((t): t is string => typeof t === "string")
    .map((typeId) => getProductType(typeId))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => {
      const allowed = new Set(t.colors.map((c) => c.en));
      const colors = form
        .getAll(`colors:${t.id}`)
        .filter((c): c is string => typeof c === "string" && allowed.has(c));
      return { colors: colors.length ? colors : [t.colors[0]!.en], typeId: t.id };
    });
}

function imageFile(value: FormDataEntryValue | null): File | null {
  return value && typeof value === "object" && "size" in value && value.size > 0 ? value : null;
}

/** Workflow C: apply a designer's submitted design to chosen products (drafts via workflow B). */
async function apply(form: FormData): Promise<AdminActionResult> {
  const found = await findDesign(form);
  if (!found) return fail("notfound");
  const { creator, design } = found;
  const picks = readPicks(form);
  const category = getCategory(str(form, "category", 40));
  if (!picks.length || !category || !creator.handle) return fail("picks");
  design.title = str(form, "title", 120) || design.title;
  design.categoryId = category.id;
  const { applyDesign } = await import("@/lib/catalog/workflow");
  const results = await applyDesign(
    {
      categoryId: category.id,
      descriptionAr: design.descriptionAr,
      descriptionEn: design.descriptionEn,
      designerHandle: creator.handle,
      designerName: creator.details?.displayName || creator.name,
      extraTags: design.tags,
      file: design.file,
      title: design.title,
    },
    picks,
  );
  design.applied = [...(design.applied ?? []), ...results];
  design.status = results.some((r) => r.status === "draft") ? "draft" : design.status;
  design.error = results.find((r) => r.error)?.error;
  design.updatedAt = new Date().toISOString();
  await saveCreator(creator);
  return design.error ? fail("shopify") : ok("applied");
}

/** Workflow B for our own (studio) designs or any approved designer, uploaded by the owner. */
async function create(form: FormData): Promise<AdminActionResult> {
  const picks = readPicks(form);
  const title = str(form, "title", 120);
  const category = getCategory(
    form.get("autoCategory") === "on"
      ? suggestCategory(
          [title, str(form, "descriptionEn", 2000), str(form, "descriptionAr", 2000)].join(" "),
        ).categoryId
      : str(form, "category", 40),
  );
  const file = imageFile(form.get("design"));
  if (!picks.length || !category || !title || !file) return fail("picks");
  if (!IMAGE_TYPES.includes(file.type) || file.size > DESIGN_MAX_BYTES) return fail("file");
  const { applyDesign, STUDIO_HANDLE } = await import("@/lib/catalog/workflow");
  const handle = str(form, "designer", 40) || STUDIO_HANDLE;
  const designer =
    handle === STUDIO_HANDLE
      ? null
      : (await listCreators()).find((c) => c.handle === handle && c.status === "approved");
  if (handle !== STUDIO_HANDLE && !designer) return fail("notfound");
  const stored = await uploadDesignFile(designer?.id ?? "studio", file);
  const poster = imageFile(form.get("posterFile"));
  const fileByType =
    poster && IMAGE_TYPES.includes(poster.type) && poster.size <= DESIGN_MAX_BYTES
      ? { print: await uploadDesignFile(designer?.id ?? "studio", poster) }
      : undefined;
  const results = await applyDesign(
    {
      categoryId: category.id,
      descriptionAr: str(form, "descriptionAr", 2000),
      descriptionEn: str(form, "descriptionEn", 2000),
      designerHandle: handle,
      designerName: designer ? designer.details?.displayName || designer.name : "Shirtat",
      file: stored,
      fileByType,
      title,
    },
    picks,
  );
  if (designer) {
    const now = new Date().toISOString();
    designer.designs = [
      {
        applied: results,
        categoryId: category.id,
        colors: [],
        createdAt: now,
        descriptionAr: str(form, "descriptionAr", 2000),
        descriptionEn: str(form, "descriptionEn", 2000),
        file: stored,
        id: newId(),
        productTypeId: "",
        status: results.some((r) => r.status === "draft") ? "draft" : "submitted",
        tags: [],
        title,
        updatedAt: now,
      },
      ...(designer.designs ?? []),
    ];
    await saveCreator(designer);
  }
  const failed = results.find((r) => r.error);
  return failed
    ? fail("shopify", failed.error!.slice(0, 300))
    : ok("created", String(results.length));
}

const OPS: Record<DesignerOp, (form: FormData) => Promise<AdminActionResult>> = {
  apply,
  create,
  delete: remove,
  design: designOp,
  resend,
  update,
};

export function isDesignerOp(value: unknown): value is DesignerOp {
  return typeof value === "string" && Object.hasOwn(OPS, value);
}

export async function runDesignerOp(op: DesignerOp, form: FormData): Promise<AdminActionResult> {
  return OPS[op](form);
}
