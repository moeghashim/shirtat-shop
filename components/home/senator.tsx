import Image from "next/image";

import { Price } from "@/components/product/price";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { getCategory } from "@/lib/collections/categories";
import { SENATOR_HEADING, SENATOR_PHRASE, senatorSlots } from "@/lib/home/senator";
import { getSenatorCampaignProducts } from "@/lib/home/server";
import { getLocale, getT } from "@/lib/i18n/server";

export async function SenatorLaunch() {
  const t = await getT();
  const locale = await getLocale();
  const politics = getCategory("politics");
  const slots = senatorSlots(await getSenatorCampaignProducts());
  const noneReady = slots.every((slot) => slot.product === null);
  const label = locale === "ar" ? politics?.labelAr : politics?.labelEn;

  return (
    <Container>
      <section
        aria-labelledby="habibi-senator"
        className="grid gap-6 rounded-3xl border border-foreground/10 bg-[#f6f1e8] p-6 md:p-10"
        data-slot="habibi-senator"
      >
        <div className="grid gap-3">
          <p>
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline"
              href="/collections/politics"
            >
              {label}
            </Link>
          </p>
          <h2
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            id="habibi-senator"
            lang="en"
          >
            {SENATOR_HEADING}
          </h2>
          <div className="flex justify-start">
            <p className="grid gap-1 text-[#1b2a4a]" dir="ltr" lang="en">
              <span className="sr-only">{SENATOR_PHRASE}</span>
              <span aria-hidden className="text-4xl font-semibold tracking-tight md:text-5xl">
                HABIBI
              </span>
              <span
                aria-hidden
                className="text-2xl font-semibold text-[#9f2d2d] underline decoration-2 underline-offset-4"
              >
                CALL ME
              </span>
              <span aria-hidden className="text-4xl font-semibold tracking-tight md:text-5xl">
                SENATOR
              </span>
            </p>
          </div>
          <p className="max-w-xl text-sm leading-6">
            {t("Illustrative concept. Not a product photo and not for sale.")}
          </p>
          {noneReady ? (
            <p className="max-w-xl text-sm leading-6">
              {t("These four pieces are not in the shop yet.")}
            </p>
          ) : null}
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => (
            <li key={slot.id}>
              {slot.product ? (
                <Link
                  className="grid h-full gap-3 rounded-2xl border border-foreground/10 bg-background p-3"
                  href={`/products/${slot.product.handle}`}
                >
                  {slot.product.image ? (
                    <span className="relative block aspect-square overflow-hidden rounded-xl bg-background">
                      <Image
                        alt=""
                        className="object-contain"
                        fill
                        sizes="100vw"
                        src={slot.product.image.url}
                      />
                    </span>
                  ) : null}
                  <span className="line-clamp-2 font-medium" dir="auto">
                    {slot.product.title}
                  </span>
                  <Price
                    amount={slot.product.price.amount}
                    currencyCode={slot.product.price.currencyCode}
                  />
                  <span className="text-sm underline underline-offset-4">{t("View product")}</span>
                </Link>
              ) : (
                <div className="grid min-h-28 content-between gap-6 rounded-2xl border border-dashed border-foreground/25 p-4">
                  <p className="text-lg font-medium">{t(slot.label)}</p>
                  <p className="text-sm text-muted-foreground">{t("Not in the shop yet")}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
