import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Page not found | الصفحة غير موجودة",
};

/** Unmatched URLs have no locale to read, so the page speaks English and Arabic. */
export default function GlobalNotFound() {
  const link =
    "inline-flex h-12 items-center justify-center rounded-lg px-8 text-sm font-medium transition-colors";
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-5 py-10 text-center">
          <section className="flex max-w-xl flex-col items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl">Page Not Found</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              The link may be incorrect, or the page has been removed.
            </p>
            <a
              href="/"
              className={`${link} mt-2 bg-primary text-primary-foreground hover:bg-primary/90`}
            >
              Continue Shopping
            </a>
          </section>
          <section className="flex max-w-xl flex-col items-center gap-2.5" dir="rtl" lang="ar">
            <h2 className="text-3xl sm:text-4xl md:text-5xl">الصفحة غير موجودة</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              ربما يكون الرابط غير صحيح، أو أن الصفحة أُزيلت.
            </p>
            <a href="/ar" className={`${link} mt-2 border hover:bg-muted`}>
              متابعة التسوّق
            </a>
          </section>
        </main>
      </body>
    </html>
  );
}
