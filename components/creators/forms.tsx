"use client";

import { useActionState, useState } from "react";

import { Link } from "@/components/ui/link";
import {
  applyAction,
  detailsAction,
  type FormState,
  signInAction,
  uploadDesignAction,
} from "@/lib/creators/actions";
import { PRODUCT_TYPES } from "@/lib/creators/product-types";
import { useLocale, useT } from "@/lib/i18n/client";

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-foreground/30";
const label = "flex flex-col gap-1.5 text-sm font-medium";
const button =
  "rounded-full bg-foreground px-6 py-3 font-medium text-background disabled:opacity-60 cursor-pointer";

function Message({ state }: { state: FormState }) {
  const t = useT();
  if (state.error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {t(state.error)}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800"
      >
        {t(state.ok)}
      </p>
    );
  }
  return null;
}

export function ApplyForm() {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(applyAction, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <Message state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          {t("Full name")} *
          <input className={input} name="name" required autoComplete="name" maxLength={120} />
        </label>
        <label className={label}>
          {t("Country")} *
          <input
            className={input}
            name="country"
            required
            autoComplete="country-name"
            maxLength={80}
          />
        </label>
        <label className={label}>
          {t("Email")} *
          <input
            className={input}
            name="email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
          />
        </label>
        <label className={label}>
          {t("Password")} *
          <input
            className={input}
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            dir="ltr"
          />
          <span className="text-xs font-normal text-muted-foreground">
            {t("At least 10 characters. You will use this to sign in.")}
          </span>
        </label>
      </div>
      <label className={label}>
        {t("Portfolio or social links")} *
        <textarea
          className={input}
          name="portfolio"
          rows={2}
          required
          dir="ltr"
          placeholder="https://instagram.com/…"
        />
        <span className="text-xs font-normal text-muted-foreground">
          {t("One per line, or separated by spaces.")}
        </span>
      </label>
      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium">{t("Sample designs")} *</legend>
        <label className={label}>
          {t("Upload files")}
          <input
            className="text-sm"
            name="designFiles"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
          />
          <span className="text-xs font-normal text-muted-foreground">
            {t("Up to 3 files, 4 MB in total. PNG, JPG, WebP, SVG or PDF.")}
          </span>
        </label>
        <label className={label}>
          {t("Or links to your designs")}
          <textarea
            className={input}
            name="designLinks"
            rows={2}
            dir="ltr"
            placeholder="https://…"
          />
        </label>
      </fieldset>
      <label className={label}>
        {t("Short bio")} *
        <textarea className={input} name="bio" rows={4} required maxLength={1200} />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("Preferred payout method")} *</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="payoutMethod" value="paypal" defaultChecked /> PayPal
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="payoutMethod" value="wise" /> Wise
        </label>
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agreeTerms" required className="mt-1" />
        <span>
          {t("I agree to the")}{" "}
          <Link className="underline" href="/creators">
            {t("Shirtat creator program terms")}
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agreeRights" required className="mt-1" />
        <span>
          {t(
            "I confirm I created these designs and own all rights to them, and I grant Shirtat a non-exclusive licence to print and sell approved designs.",
          )}
        </span>
      </label>
      <div>
        <button className={button} disabled={pending} type="submit">
          {pending ? t("Sending…") : t("Submit application")}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("Already applied?")}{" "}
        <Link className="underline" href="/creators/signin">
          {t("Sign in")}
        </Link>
      </p>
    </form>
  );
}

export function SignInForm() {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(signInAction, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <Message state={state} />
      <label className={label}>
        {t("Email")}
        <input
          className={input}
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
        />
      </label>
      <label className={label}>
        {t("Password")}
        <input
          className={input}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
        />
      </label>
      <div>
        <button className={button} disabled={pending} type="submit">
          {pending ? t("Signing in…") : t("Sign in")}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("New here?")}{" "}
        <Link className="underline" href="/creators/apply">
          {t("Apply to become a creator")}
        </Link>
      </p>
    </form>
  );
}

export function SubmitDesignForm() {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(uploadDesignAction, {});
  const [typeId, setTypeId] = useState(PRODUCT_TYPES[0]!.id);
  const type = PRODUCT_TYPES.find((p) => p.id === typeId) ?? PRODUCT_TYPES[0]!;
  return (
    <form action={action} className="flex flex-col gap-5">
      <Message state={state} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("1. Choose a product type")} *</legend>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_TYPES.map((p) => (
            <label
              key={p.id}
              className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background"
            >
              <input
                className="sr-only"
                type="radio"
                name="productType"
                value={p.id}
                checked={typeId === p.id}
                onChange={() => setTypeId(p.id)}
              />
              {locale === "ar" ? p.labelAr : p.labelEn}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("Sizes")}: <span dir="ltr">{type.sizes.join(" · ")}</span>
        </p>
      </fieldset>
      <fieldset className="flex flex-col gap-2" key={type.id}>
        <legend className="mb-2 text-sm font-medium">
          {t("2. Pick the colours it can be printed on")} *
        </legend>
        <div className="flex flex-wrap gap-3">
          {type.colors.map((c, i) => (
            <label key={c.en} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="colors" value={c.en} defaultChecked={i === 0} />
              {locale === "ar" ? c.ar : c.en}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-sm font-medium">{t("3. Upload your design")}</p>
      <label className={label}>
        {t("Design file (PNG or SVG, high resolution, up to 4 MB)")} *
        <input
          className="text-sm"
          name="design"
          type="file"
          required
          accept="image/png,image/svg+xml"
        />
      </label>
      <label className={label}>
        {t("Title")} *
        <input className={input} name="title" required maxLength={120} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {t("Description (English)")}
          <textarea
            className={input}
            name="descriptionEn"
            rows={3}
            maxLength={2000}
            dir="ltr"
            lang="en"
          />
        </label>
        <label className={label}>
          {t("Description (Arabic)")}
          <textarea
            className={input}
            name="descriptionAr"
            rows={3}
            maxLength={2000}
            dir="rtl"
            lang="ar"
          />
        </label>
      </div>
      <label className={label}>
        {t("Tags (comma separated)")}
        <input className={input} name="tags" maxLength={300} />
      </label>
      <div>
        <button className={button} disabled={pending} type="submit">
          {pending ? t("Sending…") : t("Submit design")}
        </button>
      </div>
    </form>
  );
}

export function DetailsForm({ token }: { token: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(detailsAction, {});
  const [method, setMethod] = useState("paypal");
  if (state.ok) return <Message state={state} />;
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <Message state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          {t("Legal name")} *
          <input className={input} name="legalName" required maxLength={160} autoComplete="name" />
        </label>
        <label className={label}>
          {t("Display name")} *
          <input className={input} name="displayName" required maxLength={80} />
        </label>
        <label className={label}>
          {t("Payout method")} *
          <select
            className={input}
            name="payoutMethod"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="paypal">PayPal</option>
            <option value="wise">Wise</option>
          </select>
        </label>
        <label className={label}>
          {t("Payout email")} *
          <input className={input} name="payoutEmail" type="email" required dir="ltr" />
        </label>
      </div>
      {method === "wise" && (
        <label className={label}>
          {t("Wise details (account holder, currency, any extra details)")}
          <textarea className={input} name="wiseDetails" rows={2} maxLength={600} />
        </label>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          {t("Country (for tax)")} *
          <input
            className={input}
            name="country"
            required
            maxLength={80}
            autoComplete="country-name"
          />
        </label>
        <label className={label}>
          {t("Tax ID (optional)")}
          <input className={input} name="taxId" maxLength={80} dir="ltr" />
        </label>
      </div>
      <label className={label}>
        {t("Address")} *
        <textarea
          className={input}
          name="address"
          required
          rows={2}
          maxLength={600}
          autoComplete="street-address"
        />
      </label>
      <label className={label}>
        {t("Social handles")}
        <input
          className={input}
          name="socialHandles"
          maxLength={600}
          dir="ltr"
          placeholder="@instagram, @x"
        />
      </label>
      <label className={label}>
        {t("Short bio")}
        <textarea className={input} name="bio" rows={3} maxLength={1200} />
      </label>
      <label className={label}>
        {t("Avatar (PNG, JPG or WebP, up to 2 MB)")}
        <input
          className="text-sm"
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        />
      </label>
      <div>
        <button className={button} disabled={pending} type="submit">
          {pending ? t("Sending…") : t("Save my details")}
        </button>
      </div>
    </form>
  );
}
