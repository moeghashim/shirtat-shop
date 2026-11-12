import { Link } from "@/components/ui/link";
import type { Locale } from "@/lib/i18n";
import { PRINT_METHODS, printMethodText } from "@/lib/print-methods";

export function PrintMethodCardList({
  locale,
  titleAs = "h3",
}: {
  locale: Locale;
  titleAs?: "h2" | "h3";
}) {
  const Title = titleAs;
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {PRINT_METHODS.map((method) => (
        <li key={method.id}>
          <Link
            className="grid h-full cursor-pointer grid-rows-[auto_1fr_auto] gap-4 rounded-2xl border border-foreground/10 bg-background p-5 hover:border-foreground/25"
            href={method.path}
          >
            <MethodMark id={method.id} />
            <span className="grid gap-2">
              <Title className="text-lg font-semibold">
                {printMethodText(method.name, locale)}
              </Title>
              <span className="text-sm leading-6 text-muted-foreground">
                {printMethodText(method.card, locale)}
              </span>
            </span>
            <span className="text-sm font-medium">{printMethodText(method.status, locale)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MethodMark({ id }: { id: (typeof PRINT_METHODS)[number]["id"] }) {
  return (
    <span
      aria-hidden
      className="grid size-12 place-items-center rounded-xl bg-[#f6f1e8] text-[#1b2a4a]"
      data-method={id}
    >
      {id === "dtg" ? <DtgMark /> : null}
      {id === "dtf" ? <DtfMark /> : null}
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

function DtfMark() {
  return (
    <svg className="size-7" fill="none" viewBox="0 0 32 32">
      <rect height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="11" x="6" y="9" />
      <path
        d="M19.5 16H26M23 13l3 3-3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
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
