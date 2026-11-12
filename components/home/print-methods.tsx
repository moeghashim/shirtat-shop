import { PrintMethodCardList } from "@/components/print-methods/cards";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { getLocale } from "@/lib/i18n/server";
import { PRINT_METHOD_INDEX, printMethodText } from "@/lib/print-methods";

export async function PrintMethods() {
  const locale = await getLocale();
  const text = (copy: Parameters<typeof printMethodText>[0]) => printMethodText(copy, locale);

  return (
    <Container>
      <section aria-labelledby="print-methods" className="grid gap-6" data-slot="print-methods">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {text(PRINT_METHOD_INDEX.eyebrow)}
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl" id="print-methods">
              {text(PRINT_METHOD_INDEX.title)}
            </h2>
          </div>
          <Link
            className="shrink-0 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground"
            href={PRINT_METHOD_INDEX.path}
          >
            {text(PRINT_METHOD_INDEX.read)}
          </Link>
        </div>
        <PrintMethodCardList locale={locale} />
      </section>
    </Container>
  );
}
