"use client";

import { cn } from "cn";
import { useEffect, useState } from "react";

import { localizePath } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/client";

/** EN / العربية switch. Keeps the current page and query when the page has an Arabic version. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const target = locale === "ar" ? "en" : "ar";
  const [href, setHref] = useState(target === "ar" ? "/ar" : "/");

  useEffect(() => {
    const { hash, pathname, search } = window.location;
    setHref(`${localizePath(target, pathname)}${search}${hash}`);
  }, [target]);

  return (
    <a
      className={cn("inline-flex min-h-11 min-w-11 items-center justify-center px-1 text-sm transition-opacity hover:opacity-70", className)}
      href={href}
      hrefLang={target}
      lang={target}
    >
      {target === "ar" ? (
        <span className="font-arabic">العربية</span>
      ) : (
        <span className="font-sans">EN</span>
      )}
    </a>
  );
}
