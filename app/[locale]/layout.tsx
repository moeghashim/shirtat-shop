import { BotIdClient } from "botid/client";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, El_Messiri } from "next/font/google";

import "../globals.css";
import Script from "next/script";
import { Suspense } from "react";

import { ActionBar } from "@/components/action-bar";
import { AgentButton } from "@/components/agent/agent-button";
import { AnalyticsComponents } from "@/components/analytics";
import { CartUI } from "@/components/cart/cart-ui";
import { CartProviderWrapper } from "@/components/cart/context";
import { CartStandardActionsScript } from "@/components/cart/standard-actions";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SiteSchema } from "@/components/schema/site-schema";
import { botIdProtectedRoutes } from "@/lib/botid";
import { seedCartData } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { locales, localeDir, translate } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { buildAlternates, ogLocale, siteOgImages } from "@/lib/seo";

export const ensureStatic = "prefetch";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const messiri = El_Messiri({
  variable: "--font-messiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateStaticParams = async () => locales.map((locale) => ({ locale }));

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const t = (key: string) => translate(locale, key);
  // Un-awaited: the promise streams to the client provider; never block the shell on it.
  const cartData = seedCartData();
  return (
    <html lang={locale} dir={localeDir(locale)}>
      <head>
        {shopConfig.botid.isEnabled && <BotIdClient protect={botIdProtectedRoutes} />}
        <CartStandardActionsScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${messiri.variable} ${locale === "ar" ? "font-arabic" : "font-sans"} flex min-h-dvh flex-col antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-5 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-foreground focus:outline-none"
        >
          {t("Skip to content")}
        </a>
        <SiteSchema />

        <LocaleProvider locale={locale}>
          <CartProviderWrapper cartData={cartData}>
            <Nav />
            <main id="main-content" className="flex flex-1 flex-col min-w-0">
              {children}
            </main>
            <Footer />
            <CartUI />
            <Suspense>
              <ActionBar>{shopConfig.agent.isEnabled && <AgentButton />}</ActionBar>
            </Suspense>
            <Suspense>
              <AnalyticsComponents />
            </Suspense>
          </CartProviderWrapper>
        </LocaleProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6DT5S4QRGT"
          strategy="afterInteractive"
        />
        <Script id="google-gtag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-6DT5S4QRGT');`}
        </Script>
      </body>
    </html>
  );
}

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  return {
    alternates: buildAlternates({ locale, pathname: "/" }),
    description: translate(locale, shopConfig.site.description),
    generator: shopConfig.site.name,
    icons: {
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
    metadataBase: new URL(shopConfig.site.url),
    openGraph: {
      type: "website",
      siteName: shopConfig.site.name,
      title: shopConfig.site.name,
      description: translate(locale, shopConfig.site.description),
      url: locale === "ar" ? "/ar" : "/",
      locale: ogLocale(locale),
      alternateLocale: [ogLocale(locale === "ar" ? "en" : "ar")],
      images: siteOgImages(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: shopConfig.site.name,
      description: translate(locale, shopConfig.site.description),
      images: siteOgImages(locale).map((image) => image.url),
    },
    title: {
      default: shopConfig.site.name,
      template: `%s | ${shopConfig.site.name}`,
    },
  };
};
