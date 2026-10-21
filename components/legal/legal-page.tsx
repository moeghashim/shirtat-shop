import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { getLocale } from "@/lib/i18n/server";
import { LAST_UPDATED, LEGAL, type LegalSlug } from "@/lib/legal/content";
import { buildAlternates } from "@/lib/seo";

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const locale = await getLocale();
  const page = LEGAL[slug][locale];
  return {
    title: page.title,
    description: page.intro.slice(0, 160),
    alternates: buildAlternates({ locale, pathname: LEGAL[slug].path }),
  };
}

export async function LegalPageView({ slug }: { slug: LegalSlug }) {
  const locale = await getLocale();
  const entry = LEGAL[slug];
  const page = entry[locale];
  return (
    <Page>
      <Container className="max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-semibold">{page.title}</h1>
        {entry.legal && (
          <p className="mt-3 text-sm text-muted-foreground">{LAST_UPDATED[locale]}</p>
        )}
        <p className="mt-6 text-lg text-muted-foreground">{page.intro}</p>
        <div className="mt-10 flex flex-col gap-8">
          {page.sections.map((s) => (
            <section key={s.heading} className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p} className="leading-7">
                  {p.includes("@") && !p.includes(" ") ? (
                    <a className="underline" dir="ltr" href={`mailto:${p}`}>
                      {p}
                    </a>
                  ) : (
                    p
                  )}
                </p>
              ))}
            </section>
          ))}
        </div>
      </Container>
    </Page>
  );
}
