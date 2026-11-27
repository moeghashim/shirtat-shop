"use client";

import { cn } from "cn";
import { useEffect, useId, useRef, useState } from "react";

import {
  type CommerceCountry,
  COUNTRY_COOKIE,
  COUNTRY_COOKIE_MAX_AGE,
  commerceCountries,
  currencyForCountry,
} from "@/lib/commerce";
import { useLocale } from "@/lib/i18n/client";

interface CountrySwitcherProps {
  className?: string;
  country: string;
}

function buttonLabel(country: CommerceCountry): string {
  return country.currency === "EUR" ? `${country.code} ${country.currency}` : country.currency;
}

function writeCountryCookie(code: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COUNTRY_COOKIE}=${code}; Path=/; Max-Age=${COUNTRY_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function CountrySwitcher({ className, country }: CountrySwitcherProps) {
  const locale = useLocale();
  const current =
    commerceCountries.find((entry) => entry.code === country) ??
    commerceCountries.find((entry) => entry.code === "US")!;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isArabic = locale === "ar";
  const label = isArabic ? "البلد والعملة" : "Country and currency";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (code: string) => {
    setOpen(false);
    if (code === current.code) return;
    writeCountryCookie(code);
    window.location.reload();
  };

  const groups = [
    { id: "core", title: null },
    { id: "eurozone", title: isArabic ? "منطقة اليورو" : "Eurozone" },
  ] as const;

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label}: ${isArabic ? current.nameAr : current.nameEn}`}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center px-1 text-sm tabular-nums transition-opacity hover:opacity-70"
        dir="ltr"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {buttonLabel(current)}
      </button>
      {open ? (
        <ul
          className="absolute end-0 top-full z-40 mt-1 max-h-[min(24rem,70vh)] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-lg"
          id={listId}
          role="listbox"
        >
          {groups.map((group) => (
            <li key={group.id}>
              {group.title ? (
                <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground">{group.title}</p>
              ) : null}
              <ul>
                {commerceCountries
                  .filter((entry) => entry.group === group.id)
                  .map((entry) => {
                    const selected = entry.code === current.code;
                    const name = isArabic ? entry.nameAr : entry.nameEn;
                    return (
                      <li key={entry.code}>
                        <button
                          aria-selected={selected}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-start text-sm hover:bg-muted",
                            selected && "bg-muted",
                          )}
                          dir={isArabic ? "rtl" : "ltr"}
                          onClick={() => choose(entry.code)}
                          role="option"
                          type="button"
                        >
                          <span className={isArabic ? "font-arabic" : undefined}>{name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground" dir="ltr">
                            {currencyForCountry(entry.code)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
