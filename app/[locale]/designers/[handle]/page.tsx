import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DesignerAvatar } from "@/components/designers/avatar";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { getPublicDesigner } from "@/lib/designers/server";
import { formatLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates } from "@/lib/seo";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

export const generateStaticParams = async () => [{ handle: PLACEHOLDER_HANDLE }];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/designers/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const t = await getT();
  return {
    title: t("Designs by @{handle}", { handle }),
    alternates: buildAlternates({ locale: await getLocale(), pathname: `/designers/${handle}` }),
  };
}

export default function DesignerPage({ params }: PageProps<"/[locale]/designers/[handle]">) {
  return (
    <Page>
      <Container className="max-w-5xl">
        <Suspense fallback={null}>
          <DesignerContent params={params} />
        </Suspense>
      </Container>
    </Page>
  );
}

async function DesignerContent({ params }: { params: Promise<{ handle: string }> }) {
  await connection();
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  const t = await getT();
  const locale = await getLocale();
  const data = await getPublicDesigner(handle).catch(() => null);
  if (!data) notFound();
  const { designer, products } = data;
  const money = (a: { amount: string; currencyCode: string }) =>
    new Intl.NumberFormat(formatLocale(locale), {
      currency: a.currencyCode,
      style: "currency",
    }).format(Number(a.amount));
  return (
    <>
      <Link className="text-sm underline" href="/designers">
        {t("All designers")}
      </Link>
      <header className="mt-6 flex flex-wrap items-center gap-6">
        <DesignerAvatar
          initials={designer.initials}
          name={locale === "ar" && designer.nameAr ? designer.nameAr : designer.name}
          size={112}
          url={designer.avatarUrl}
        />
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-4xl font-semibold">{locale === "ar" && designer.nameAr ? designer.nameAr : designer.name}</h1>
          <p className="text-sm text-muted-foreground" dir="ltr">
            @{designer.handle}
          </p>
          {designer.bio && (
            <p className="whitespace-pre-line">
              {locale === "ar" && designer.bioAr ? designer.bioAr : designer.bio}
            </p>
          )}
        </div>
      </header>
      {products.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          {t("No designs on sale yet. Check back soon.")}
        </p>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link className="flex flex-col gap-2" href={`/products/${p.handle}`}>
                <span className="aspect-square overflow-hidden rounded-xl bg-muted">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={p.image.altText ?? p.title}
                      className="h-full w-full object-cover"
                      src={p.image.url}
                    />
                  )}
                </span>
                <span className="font-medium">{p.title}</span>
                <span className="text-sm text-muted-foreground" dir="ltr">
                  {money(p.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
