import { Container } from "@/components/ui/container";
import { getT } from "@/lib/i18n/server";

const METHODS = [
  {
    id: "dtg",
    title: "Direct to garment",
    body: "Ink goes straight onto the fabric. Tees, hoodies and sweatshirts in the shop are printed this way.",
    status: "In the shop",
  },
  {
    id: "embroidery",
    title: "Embroidery",
    body: "The design is stitched into the knit. The beanies in the shop are embroidered.",
    status: "In the shop",
  },
  {
    id: "aop",
    title: "All-over print",
    body: "The print covers the garment, rather than sitting in one spot. No all-over-print piece is in the shop yet.",
    status: "Not in the shop yet",
  },
] as const;

export async function PrintMethods() {
  const t = await getT();

  return (
    <Container>
      <section aria-labelledby="print-methods" className="grid gap-6" data-slot="print-methods">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("Printing")}
          </p>
          <h2 className="text-2xl font-semibold sm:text-3xl" id="print-methods">
            {t("Three print methods")}
          </h2>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {METHODS.map((method) => (
            <li key={method.id}>
              <article className="grid h-full gap-4 rounded-2xl border border-foreground/10 bg-background p-5">
                <MethodMark id={method.id} />
                <div className="grid gap-2">
                  <h3 className="text-lg font-semibold">{t(method.title)}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{t(method.body)}</p>
                </div>
                <p
                  className="text-sm font-medium data-[available=false]:text-muted-foreground"
                  data-available={method.id === "aop" ? "false" : "true"}
                >
                  {t(method.status)}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}

function MethodMark({ id }: { id: (typeof METHODS)[number]["id"] }) {
  return (
    <span
      aria-hidden
      className="grid size-12 place-items-center rounded-xl bg-[#f6f1e8] text-[#1b2a4a]"
      data-method={id}
    >
      {id === "dtg" ? <DtgMark /> : null}
      {id === "embroidery" ? <EmbroideryMark /> : null}
      {id === "aop" ? <AopMark /> : null}
    </span>
  );
}

function DtgMark() {
  return (
    <svg className="size-7" fill="none" viewBox="0 0 32 32">
      <path
        d="M8 10.5 11.5 8h9L24 10.5V14l-2.2 1.2V24H10.2v-8.8L8 14v-3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="16" cy="16.5" fill="currentColor" r="1.4" />
    </svg>
  );
}

function EmbroideryMark() {
  return (
    <svg className="size-7" fill="none" viewBox="0 0 32 32">
      <path
        d="M8 20c2.2-4 4.2-4 6.2 0s4 4 6.2 0 4-4 6.2 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M8 14.5c2.2-4 4.2-4 6.2 0s4 4 6.2 0 4-4 6.2 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function AopMark() {
  return (
    <svg className="size-7" fill="none" viewBox="0 0 32 32">
      <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.6" width="16" x="8" y="8" />
      <path
        d="M8 20.5 12 16l4 4 3-3 5 5"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M11 12.5h.01M16 11.5h.01M20.5 14h.01" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}
