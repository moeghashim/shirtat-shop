import { type ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { PRINT_METHOD_INDEX, PRINT_METHODS, printMethodText } from "@/lib/print-methods";
import type { PrintMethod } from "@/lib/print-methods";

export function PrintMethodSkeleton() {
  return (
    <Page aria-busy="true">
      <Container>
        <div className="grid gap-10">
          <div className="grid max-w-3xl gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-2/3 max-w-xl sm:h-12" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
          <div className="grid max-w-3xl gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          <PrintMethodShopSkeleton />
        </div>
      </Container>
    </Page>
  );
}

export function PrintMethodShopSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {["a", "b", "c", "d"].map((slot) => (
        <div className="grid gap-2" key={slot}>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function PrintMethodArticle({
  children,
  locale,
  method,
}: {
  children?: ReactNode;
  locale: Locale;
  method: PrintMethod;
}) {
  const text = (copy: Parameters<typeof printMethodText>[0]) => printMethodText(copy, locale);
  const others = PRINT_METHODS.filter((item) => item.id !== method.id);
  return (
    <Page>
      <Container>
        <article className="grid gap-10" data-method={method.id} data-slot="print-method">
          <header className="grid max-w-3xl gap-3">
            <Link
              className="w-fit cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground"
              href={PRINT_METHOD_INDEX.path}
            >
              {text(PRINT_METHOD_INDEX.title)}
            </Link>
            <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">{text(method.name)}</h1>
            <p className="leading-7 text-muted-foreground">{text(method.card)}</p>
          </header>
          {method.sections.map((section) => (
            <section className="grid max-w-3xl gap-3" key={section.id}>
              <h2 className="text-2xl font-semibold">{text(section.heading)}</h2>
              {section.body.map((paragraph) => (
                <p className="leading-7" key={text(paragraph)}>
                  {text(paragraph)}
                </p>
              ))}
            </section>
          ))}
          <section className="grid gap-4">
            <h2 className="text-2xl font-semibold">{text(PRINT_METHOD_INDEX.shop)}</h2>
            <p className="max-w-3xl leading-7">{text(method.shopNote)}</p>
            <ul className="flex flex-wrap gap-2">
              {method.shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                    href={link.href}
                  >
                    {text(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
            {children}
          </section>
          <nav className="grid max-w-3xl gap-3">
            <h2 className="text-2xl font-semibold">{text(PRINT_METHOD_INDEX.other)}</h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {others.map((item) => (
                <li key={item.id}>
                  <Link className="cursor-pointer underline underline-offset-4" href={item.path}>
                    {text(item.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </Container>
    </Page>
  );
}
