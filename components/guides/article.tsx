import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { guideRails } from "@/lib/guides/select";
import { loadGuideSources } from "@/lib/guides/server";
import type { Guide } from "@/lib/guides/types";
import { pick } from "@/lib/guides/types";
import { commerceLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

import { GuideRails } from "./product-rail";

function RichText({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/\S+)/);
  return (
    <p className="max-w-3xl leading-7">
      {parts.map((part) =>
        part.startsWith("https://") ? (
          <a
            className="underline underline-offset-4"
            href={part}
            key={part}
            rel="noopener"
            target="_blank"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export async function GuideArticle({ guide, locale }: { guide: Guide; locale: Locale }) {
  const { catalog, occasions } = await loadGuideSources(guide.match, commerceLocale(locale));
  const rails = guideRails(guide, catalog, occasions);
  const hasProducts = rails.some((rail) => rail.products.length > 0);
  const hasNote = rails.some((rail) => rail.note);
  const showEmpty = !hasProducts && !hasNote && guide.match.kind !== "none";

  return (
    <Page>
      <Container>
        <article className="grid gap-10">
          <header className="grid gap-3">
            <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">
              {pick(guide.h1, locale)}
            </h1>
            {guide.intro.map((paragraph) => (
              <RichText key={pick(paragraph, locale)} text={pick(paragraph, locale)} />
            ))}
          </header>
          {guide.sections.map((section) => (
            <section className="grid gap-3" key={pick(section.heading, locale)}>
              <h2 className="text-2xl font-semibold">{pick(section.heading, locale)}</h2>
              {section.paragraphs.map((paragraph) => (
                <RichText key={pick(paragraph, locale)} text={pick(paragraph, locale)} />
              ))}
            </section>
          ))}
          <GuideRails locale={locale} rails={rails} />
          {showEmpty ? <p className="max-w-3xl leading-7">{pick(guide.empty, locale)}</p> : null}
          {guide.links.length > 0 ? (
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              {guide.links.map((link) => (
                <Link className="underline underline-offset-4" href={link.href} key={link.href}>
                  {pick(link.label, locale)}
                </Link>
              ))}
            </nav>
          ) : null}
        </article>
      </Container>
    </Page>
  );
}
