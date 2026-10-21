"use server";

import { redirect } from "next/navigation";

import { isLocale, localizePath, type Locale } from "@/lib/i18n";

import { authenticate, clearSession, createSession, getSession, hashPassword, isAdminEmail } from "./auth";
import {
  deleteCreatorAndUser,
  getCreator,
  getUserByEmail,
  listCreators,
  newId,
  saveCreator,
  saveUser,
  uploadDesignFile,
} from "./store";
import type { CreatorRecord, DesignSubmission, PayoutMethod, TierOverride } from "./types";

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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 10) return { error: "Password must be at least 10 characters." };
  if (payout !== "paypal" && payout !== "wise") return { error: "Choose a payout method." };
  if (form.get("agreeTerms") !== "on" || form.get("agreeRights") !== "on") {
    return { error: "You must accept the program terms and confirm you own the rights to your designs." };
  }
  if (portfolioLinks.length === 0) return { error: "Add at least one portfolio or social link." };
  const files = validFiles(form, "designFiles");
  if (typeof files === "string") return { error: files };
  if (files.length === 0 && designLinks.length === 0) {
    return { error: "Add at least one sample design (upload or link)." };
  }
  if (isAdminEmail(email) || (await getUserByEmail(email))) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  const id = newId();
  const now = new Date().toISOString();
  await saveUser({ createdAt: now, email, id, name, passwordHash: await hashPassword(password) });
  const uploaded = await uploadAll(id, files);
  const creator: CreatorRecord = {
    agreedToTermsAt: now,
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
    submissions: [{ createdAt: now, files: uploaded, links: designLinks, note: "Application sample" }],
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
  if (!creator || creator.status !== "approved") return { error: "Only approved creators can submit designs." };
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
  if (status === "approved" && !handle && !creator.handle) redirect("/admin/creators?error=needhandle");
  if (status === "pending" || status === "approved" || status === "rejected") {
    if (status !== creator.status) creator.reviewedAt = new Date().toISOString();
    creator.status = status;
  }
  if (tier === "auto" || tier === "standard" || tier === "top") creator.tierOverride = tier;
  if (handle) creator.handle = handle;
  await saveCreator(creator);
  redirect("/admin/creators?saved=1");
}

export async function adminDeleteAction(form: FormData): Promise<void> {
  await requireAdmin();
  const creator = await getCreator(str(form, "id", 80));
  if (creator && form.get("confirm") === "delete") await deleteCreatorAndUser(creator);
  redirect("/admin/creators?deleted=1");
}
