import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { getLocale } from "@/lib/i18n/server";

const COPY = {
  ar: {
    body: "أسعار حالية من المتجر، وقطع للأطفال والرضّع، واسم يُرسم على التيشيرت.",
    link: "دليل الهدايا",
    title: "تبحث عن هدية؟",
  },
  en: {
    body: "Current shop prices, pieces for kids and babies, and a name drawn on a shirt.",
    link: "Gift guide",
    title: "Looking for a gift?",
  },
} as const;

export async function GiftGuideLink() {
  const locale = await getLocale();
  const copy = COPY[locale];
  return (
    <Container>
      <section className="grid gap-2">
        <h2 className="text-xl font-semibold">{copy.title}</h2>
        <p className="max-w-3xl text-muted-foreground">{copy.body}</p>
        <p>
          <Link className="underline underline-offset-4" href="/gift-guide">
            {copy.link}
          </Link>
        </p>
      </section>
    </Container>
  );
}
