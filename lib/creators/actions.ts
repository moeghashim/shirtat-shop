"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import { adminDesignersUrl } from "@/lib/admin-api/urls";
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
  // The owner's admin moved to admin.shirtat.co (better-auth); designers stay on the storefront.
  redirect(session.isAdmin ? adminDesignersUrl() : localizePath(locale, "/creators/dashboard"));
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
