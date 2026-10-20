import Image from "next/image";

import { Container } from "@/components/ui/container";

interface InspirationCard {
  title: string;
  description: string;
}

const cards: InspirationCard[] = [
  {
    title: "Thuluth",
    description:
      "Tall, sweeping letters once reserved for mosque walls, now made for everyday wear.",
  },
  {
    title: "Kufic",
    description: "The oldest Arabic script, with bold geometric lines that feel strikingly modern.",
  },
  {
    title: "Diwani",
    description: "The flowing script of royal decrees, full of curves, rhythm and movement.",
  },
  {
    title: "Words worth wearing",
    description:
      "Every design carries a word or phrase chosen for its meaning, not just its shape.",
  },
];

export function Inspiration() {
  return (
    <Container>
      <section className="relative overflow-hidden rounded-3xl bg-muted/60 px-6 py-14 md:px-14 md:py-20">
        <Image
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-6 w-72 opacity-[0.06] select-none md:w-[28rem] dark:invert"
          height={366}
          src="/shirtat-logo-mark.svg"
          unoptimized
          width={554}
        />
        <div className="relative flex max-w-2xl flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Inspiration
          </p>
          <h2 className="text-3xl font-semibold md:text-5xl">Inspired by the art of the pen</h2>
          <p className="text-muted-foreground md:text-lg">
            For centuries, Arabic calligraphy has turned words into art. We bring that tradition off
            the page and onto clothing, so every piece is wearable art.
          </p>
        </div>
        <ul className="relative mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <li
              key={card.title}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
