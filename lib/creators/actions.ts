"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import { getCategory } from "@/lib/collections/categories";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";

import {
  authenticate,
  clearSession,
  createSession,
  getSession,
  hashPassword,
  isAdminEmail,
  verifyPassword,
} from "./auth";
import { queueResetEmail, sendApprovalEmail } from "./email";
import { getProductType } from "./product-types";
import { archiveProduct, createDraftProduct, publishProduct } from "./shopify-admin";
import {
  deleteCreatorAndUser,
  consumeResetToken,
  deleteQueuedEmails,
  getAdminPasswordHash,
  saveResetToken,
  setAdminPasswordHash,
  getCreator,
  getUserByEmail,
  listCreators,
  newId,
  saveCreator,
  saveUser,
  uploadDesignFile,
} from "./store";
import { ADMIN_EMAIL } from "./terms";
import { checkDetailsToken, issueDetailsToken, parseDetailsToken, siteUrl } from "./tokens";
import type {
  CreatorRecord,
  DesignRecord,
  DesignSubmission,
  PayoutMethod,
  TierOverride,
} from "./types";

export interface FormState {
  error?: string;
  ok?: string;
}

const MAX_FILES = 3;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];

function str(form: FormData, key: string, max = 2000): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function localeOf(form: FormData): Locale {
  const value = form.get("locale");
  return isLocale(value) ? value : "en";
}

function parseLinks(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/^https?:\/\//i.test(s) ? s : `https://${s}`))
    .filter((s) => {
      try {
        const url = new URL(s);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    })
    .slice(0, 10);
}

function validFiles(form: FormData, key: string): File[] | string {
  const files = form
    .getAll(key)
    .filter((f): f is File => typeof f === "object" && f !== null && "size" in f && f.size > 0);
  if (files.length > MAX_FILES) return "Upload up to 3 files.";
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > MAX_FILE_BYTES) return "Files must be 4 MB or less in total.";
  if (files.some((f) => !ALLOWED_TYPES.includes(f.type))) {
    return "Files must be PNG, JPG, WebP, SVG or PDF.";
  }
  return files;
}

async function uploadAll(id: string, files: File[]): Promise<DesignSubmission["files"]> {
  return Promise.all(files.map((f) => uploadDesignFile(id, f)));
}

const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Logo or profile picture: required, PNG/JPG/WebP, up to 2 MB (shown cropped to a square). */
function validAvatar(value: FormDataEntryValue | null): File | string {
  if (!value || typeof value !== "object" || !("size" in value) || value.size === 0)
    return "Add a logo or profile picture.";
  if (!AVATAR_TYPES.includes(value.type))
    return "Logo or profile picture must be PNG, JPG or WebP.";
  if (value.size > AVATAR_MAX_BYTES) return "Logo or profile picture must be 2 MB or smaller.";
  return value;
}

export async function avatarAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.isAdmin) return { error: "Please sign in." };
  const creator = await getCreator(session.uid);
  if (!creator) return { error: "Please sign in." };
  const file = validAvatar(form.get("avatar"));
  if (typeof file === "string") return { error: file };
  creator.avatar = {
    ...(await uploadDesignFile(creator.id, file)),
    kind: str(form, "avatarKind", 10) === "logo" ? "logo" : "photo",
  };
  await saveCreator(creator);
  return { ok: "Saved. Your picture now appears on your designer page." };
}

export async function applyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const name = str(form, "name", 120);
  const email = str(form, "email", 200).toLowerCase();
  const password = str(form, "password", 200);
  const country = str(form, "country", 80);
  const bio = str(form, "bio", 1200);
  const payout = str(form, "payoutMethod", 10) as PayoutMethod;
  const portfolioLinks = parseLinks(str(form, "portfolio", 2000));
  const designLinks = parseLinks(str(form, "designLinks", 2000));

  if (!name || !email || !country || !bio) return { error: "Please fill in all required fields." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Please enter a valid email address." };
  if (password.length < 10) return { error: "Password must be at least 10 characters." };
  if (payout !== "paypal" && payout !== "wise") return { error: "Choose a payout method." };
  if (form.get("agreeTerms") !== "on" || form.get("agreeRights") !== "on") {
    return {
      error: "You must accept the program terms and confirm you own the rights to your designs.",
    };
  }
  if (portfolioLinks.length === 0) return { error: "Add at least one portfolio or social link." };
  const files = validFiles(form, "designFiles");
  if (typeof files === "string") return { error: files };
  if (files.length === 0 && designLinks.length === 0) {
    return { error: "Add at least one sample design (upload or link)." };
  }
  const avatarFile = validAvatar(form.get("avatar"));
  if (typeof avatarFile === "string") return { error: avatarFile };
  const avatarKind = str(form, "avatarKind", 10) === "logo" ? "logo" : "photo";
  if (isAdminEmail(email) || (await getUserByEmail(email))) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  const id = newId();
  const now = new Date().toISOString();
  await saveUser({ createdAt: now, email, id, name, passwordHash: await hashPassword(password) });
  const uploaded = await uploadAll(id, files);
  const avatar = { ...(await uploadDesignFile(id, avatarFile)), kind: avatarKind } as const;
  const creator: CreatorRecord = {
    agreedToTermsAt: now,
    avatar,
    bio,
    country,
    createdAt: now,
    email,
    handle: null,
    id,
    locale,
    name,
    payoutMethod: payout,
    portfolioLinks,
    reviewedAt: null,
    status: "pending",
    submissions: [
      { createdAt: now, files: uploaded, links: designLinks, note: "Application sample" },
    ],
    tierOverride: "auto",
    updatedAt: now,
  };
  await saveCreator(creator);
  await createSession({ email, isAdmin: false, uid: id });
  redirect(localizePath(locale, "/creators/dashboard"));
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const session = await authenticate(str(form, "email", 200), str(form, "password", 200));
  if (!session) return { error: "Incorrect email or password." };
  await createSession(session);
  if (!session.isAdmin) {
    const creator = await getCreator(session.uid);
    if (creator) await saveCreator({ ...creator, lastSignInAt: new Date().toISOString() });
  }
  redirect(session.isAdmin ? "/admin/creators" : localizePath(locale, "/creators/dashboard"));
}

export async function signOutAction(form: FormData): Promise<void> {
  await clearSession();
  redirect(localizePath(localeOf(form), "/creators"));
}

export async function submitDesignAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.isAdmin) return { error: "Please sign in." };
  const creator = await getCreator(session.uid);
  if (!creator || creator.status !== "approved")
    return { error: "Only approved designers can submit designs." };
  const links = parseLinks(str(form, "designLinks", 2000));
  const files = validFiles(form, "designFiles");
  if (typeof files === "string") return { error: files };
  if (files.length === 0 && links.length === 0) return { error: "Add a file or a link." };
  const uploaded = await uploadAll(creator.id, files);
  creator.submissions.unshift({
    createdAt: new Date().toISOString(),
    files: uploaded,
    links,
    note: str(form, "note", 600),
  });
  await saveCreator(creator);
  return { ok: "Design submitted. We will review it soon." };
}

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/creators/signin");
  return session;
}

export async function adminUpdateAction(form: FormData): Promise<void> {
  await requireAdmin();
  const creator = await getCreator(str(form, "id", 80));
  if (!creator) redirect("/admin/creators?error=notfound");
  const status = str(form, "status", 20);
  const tier = str(form, "tierOverride", 20) as TierOverride;
  const handle = str(form, "handle", 40).toLowerCase();
  if (handle && !/^[a-z0-9][a-z0-9-]{1,38}$/.test(handle)) redirect("/admin/creators?error=handle");
  if (handle && handle !== creator.handle) {
    const taken = (await listCreators()).some((c) => c.id !== creator.id && c.handle === handle);
    if (taken) redirect("/admin/creators?error=taken");
  }
  if (status === "approved" && !handle && !creator.handle)
    redirect("/admin/creators?error=needhandle");
  if (status === "pending" || status === "approved" || status === "rejected") {
    if (status !== creator.status) creator.reviewedAt = new Date().toISOString();
    creator.status = status;
  }
  if (tier === "auto" || tier === "standard" || tier === "top") creator.tierOverride = tier;
  if (handle) creator.handle = handle;
  const newlyApproved = creator.status === "approved" && !creator.detailsEmail && !creator.details;
  if (newlyApproved) await sendDetailsLink(creator);
  await saveCreator(creator);
  redirect("/admin/creators?saved=1");
}

export async function adminDeleteAction(form: FormData): Promise<void> {
  await requireAdmin();
  const creator = await getCreator(str(form, "id", 80));
  if (creator && form.get("confirm") === "delete") {
    await deleteQueuedEmails(creator.id);
    await deleteCreatorAndUser(creator);
  }
  redirect("/admin/creators?deleted=1");
}

/** Issues a fresh details link, emails it (when a provider is configured) and records the result. */
async function sendDetailsLink(creator: CreatorRecord): Promise<string> {
  const link = issueDetailsToken(creator);
  const result = await sendApprovalEmail(creator, link);
  creator.detailsEmail = { ...result, sentAt: new Date().toISOString() };
  creator.detailsLink = link;
  return link;
}

export async function adminResendDetailsAction(form: FormData): Promise<void> {
  await requireAdmin();
  const creator = await getCreator(str(form, "id", 80));
  if (!creator || creator.status !== "approved") redirect("/admin/creators?error=notfound");
  await sendDetailsLink(creator);
  await saveCreator(creator);
  redirect(`/admin/creators?email=${creator.detailsEmail?.status ?? "failed"}`);
}

export async function detailsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = parseDetailsToken(str(form, "token", 300));
  const creator = parsed ? await getCreator(parsed.id) : null;
  if (
    !parsed ||
    !creator ||
    creator.status !== "approved" ||
    !checkDetailsToken(creator, parsed.raw)
  ) {
    return { error: "This link has expired or is invalid. Ask us for a new one." };
  }
  const legalName = str(form, "legalName", 160);
  const displayName = str(form, "displayName", 80);
  const payoutMethod = str(form, "payoutMethod", 10) as PayoutMethod;
  const payoutEmail = str(form, "payoutEmail", 200).toLowerCase();
  const wiseDetails = str(form, "wiseDetails", 600);
  const country = str(form, "country", 80);
  const address = str(form, "address", 600);
  if (
    !legalName ||
    !displayName ||
    !country ||
    !address ||
    (payoutMethod !== "paypal" && payoutMethod !== "wise")
  ) {
    return { error: "Please fill in all required fields." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payoutEmail))
    return { error: "Enter a valid payout email." };
  let avatar = creator.details?.avatar;
  const file = form.get("avatar");
  if (file && typeof file === "object" && "size" in file && file.size > 0) {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      return { error: "Avatar must be a PNG, JPG or WebP under 2 MB." };
    }
    avatar = await uploadDesignFile(creator.id, file);
  }
  creator.details = {
    address,
    avatar,
    bio: str(form, "bio", 1200),
    country,
    displayName,
    legalName,
    payoutEmail,
    payoutMethod,
    socialHandles: str(form, "socialHandles", 600),
    submittedAt: new Date().toISOString(),
    taxId: str(form, "taxId", 80),
    wiseDetails,
  };
  creator.detailsToken = undefined;
  await saveCreator(creator);
  return { ok: "Thank you. Your details are saved." };
}

const DESIGN_TYPES = ["image/png", "image/svg+xml"];
const DESIGN_MAX_BYTES = 4 * 1024 * 1024;

export async function uploadDesignAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.isAdmin) return { error: "Please sign in." };
  const creator = await getCreator(session.uid);
  if (!creator || creator.status !== "approved" || !creator.handle) {
    return { error: "Only approved designers can submit designs." };
  }
  const title = str(form, "title", 120);
  if (!title) return { error: "Please fill in all required fields." };
  const type = getProductType(str(form, "productType", 40));
  const category = getCategory(str(form, "category", 40));
  const allowed = new Set(type?.colors.map((c) => c.en) ?? []);
  const colors = form
    .getAll("colors")
    .filter((c): c is string => typeof c === "string" && allowed.has(c));
  const file = form.get("design");
  if (!file || typeof file !== "object" || !("size" in file) || file.size === 0)
    return { error: "Add your design file." };
  if (!DESIGN_TYPES.includes(file.type)) return { error: "Designs must be PNG or SVG." };
  if (file.size > DESIGN_MAX_BYTES) return { error: "Each file must be 4 MB or smaller." };
  const now = new Date().toISOString();
  const design: DesignRecord = {
    categoryId: category?.id,
    colors,
    createdAt: now,
    descriptionAr: str(form, "descriptionAr", 2000),
    descriptionEn: str(form, "descriptionEn", 2000),
    file: await uploadDesignFile(creator.id, file),
    id: newId(),
    productTypeId: type?.id ?? "",
    status: "submitted",
    tags: [
      ...(category ? [`category:${category.id}`] : []),
      ...str(form, "tags", 300)
        .split(",")
        .map((t) => t.trim().slice(0, 40))
        .filter((t) => {
          const l = t.toLowerCase();
          return t && !/^(creator|designer|category):/.test(l);
        })
        .slice(0, 10),
    ],
    title,
    updatedAt: now,
  };
  creator.designs = [design, ...(creator.designs ?? [])];
  await saveCreator(creator);
  return { ok: "Design submitted. We will review it soon." };
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

async function findDesign(form: FormData) {
  await requireAdmin();
  const creator = await getCreator(str(form, "id", 80));
  const design = creator?.designs?.find((d) => d.id === str(form, "designId", 80));
  if (!creator || !design) redirect("/admin/creators?error=notfound");
  return { creator, design };
}

export async function adminDesignAction(form: FormData): Promise<void> {
  const { creator, design } = await findDesign(form);
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
  redirect(result === "saved" ? "/admin/creators?saved=1" : "/admin/creators?error=shopify");
}

const PASSWORD_MIN = 10;

/** Always answers the same way so it never reveals whether an account exists. */
export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const email = str(form, "email", 200).toLowerCase();
  const done = {
    ok: "If an account exists for that email, we have sent a reset link. It expires in 1 hour.",
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return done;
  const admin = isAdminEmail(email);
  const user = admin ? null : await getUserByEmail(email);
  if (!admin && !user) return done;
  const raw = randomBytes(24).toString("base64url");
  const uid = admin ? "admin" : user!.id;
  await saveResetToken(raw, {
    email,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    uid,
  });
  const link = `${siteUrl()}${localizePath(admin ? "en" : locale, "/creators/reset")}?t=${raw}`;
  await queueResetEmail({
    link,
    name: admin ? "Moe" : user!.name,
    to: admin ? ADMIN_EMAIL : email,
    uid,
  });
  return done;
}

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const password = str(form, "password", 200);
  if (password.length < PASSWORD_MIN) return { error: "Password must be at least 10 characters." };
  if (password !== str(form, "confirm", 200)) return { error: "Passwords do not match." };
  const token = await consumeResetToken(str(form, "token", 200));
  if (!token) return { error: "This link has expired or is invalid. Ask us for a new one." };
  const hash = await hashPassword(password);
  if (token.uid === "admin") {
    await setAdminPasswordHash(hash);
  } else {
    const user = await getUserByEmail(token.email);
    if (!user || user.id !== token.uid)
      return { error: "This link has expired or is invalid. Ask us for a new one." };
    await saveUser({ ...user, passwordHash: hash });
  }
  return { ok: "Your password has been changed. You can sign in now." };
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in." };
  const current = str(form, "current", 200);
  const password = str(form, "password", 200);
  if (password.length < PASSWORD_MIN) return { error: "Password must be at least 10 characters." };
  if (password !== str(form, "confirm", 200)) return { error: "Passwords do not match." };
  if (session.isAdmin) {
    const stored = (await getAdminPasswordHash()) ?? process.env.ADMIN_PASSWORD_HASH ?? "";
    if (!(await verifyPassword(current, stored)))
      return { error: "Your current password is incorrect." };
    await setAdminPasswordHash(await hashPassword(password));
  } else {
    const user = await getUserByEmail(session.email);
    if (!user || !(await verifyPassword(current, user.passwordHash)))
      return { error: "Your current password is incorrect." };
    await saveUser({ ...user, passwordHash: await hashPassword(password) });
  }
  return { ok: "Your password has been changed." };
}

/** Reads the admin's product picks: checked `types` plus `colors:<typeId>` per type. */
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

/** Workflow C: the admin applies a designer's submitted design to chosen products (drafts via workflow B). */
export async function adminApplyDesignAction(form: FormData): Promise<void> {
  const { creator, design } = await findDesign(form);
  const picks = readPicks(form);
  const category = getCategory(str(form, "category", 40));
  if (!picks.length || !category || !creator.handle) redirect("/admin/creators?error=picks");
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
  redirect(design.error ? "/admin/creators?error=shopify" : "/admin/creators?applied=1");
}

/** Workflow B for our own (studio) designs or any approved designer, uploaded by the admin. */
export async function adminCreateFromDesignAction(form: FormData): Promise<void> {
  await requireAdmin();
  const picks = readPicks(form);
  const title = str(form, "title", 120);
  const { suggestCategory } = await import("@/lib/catalog/categorize");
  const category = getCategory(
    form.get("autoCategory") === "on"
      ? suggestCategory(
          [title, str(form, "descriptionEn", 2000), str(form, "descriptionAr", 2000)].join(" "),
        ).categoryId
      : str(form, "category", 40),
  );
  const file = form.get("design");
  if (!picks.length || !category || !title) redirect("/admin/creators?error=picks");
  if (!file || typeof file !== "object" || !("size" in file) || file.size === 0)
    redirect("/admin/creators?error=picks");
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > DESIGN_MAX_BYTES)
    redirect("/admin/creators?error=file");
  const { applyDesign, STUDIO_HANDLE } = await import("@/lib/catalog/workflow");
  const handle = str(form, "designer", 40) || STUDIO_HANDLE;
  const designer =
    handle === STUDIO_HANDLE
      ? null
      : (await listCreators()).find((c) => c.handle === handle && c.status === "approved");
  if (handle !== STUDIO_HANDLE && !designer) redirect("/admin/creators?error=notfound");
  const stored = await uploadDesignFile(designer?.id ?? "studio", file);
  const results = await applyDesign(
    {
      categoryId: category.id,
      descriptionAr: str(form, "descriptionAr", 2000),
      descriptionEn: str(form, "descriptionEn", 2000),
      designerHandle: handle,
      designerName: designer ? designer.details?.displayName || designer.name : "Shirtat Studio",
      file: stored,
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
  redirect(failed ? "/admin/creators?error=shopify" : `/admin/creators?created=${results.length}`);
}
