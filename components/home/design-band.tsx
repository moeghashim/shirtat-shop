import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { getT } from "@/lib/i18n/server";

export async function DesignBand() {
  const t = await getT();
  return (
    <Container>
      <div className="relative isolate flex flex-col items-start gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-emerald-950 px-6 py-10 text-white sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-12">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-6 end-4 -z-10 select-none font-serif text-[9rem] leading-none text-white/10 sm:text-[12rem]"
          dir="rtl"
          lang="ar"
        >
          صمّم
        </span>
        <div className="grid max-w-xl gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            {t("Design your own")}
          </p>
          <h2 className="text-2xl font-semibold sm:text-4xl">
            {t("Your sentence in Arabic calligraphy.")}
          </h2>
          <p className="text-sm text-white/80 sm:text-base">
            {t("Type it, pick a style, and get it on a tee, a hoodie or a mug.")}
          </p>
        </div>
        <Link
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-stone-950 transition-colors hover:bg-white/90"
          href="/design"
        >
          {t("Start designing")}
        </Link>
      </div>
    </Container>
  );
}
