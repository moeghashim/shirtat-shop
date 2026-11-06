"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { defaultAgentSelection, findAgentVariant, selectAgentOption } from "@/lib/agent/products";
import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";
import { useLocale, useT } from "@/lib/i18n/client";

import { AgentChooserBody, AgentProductCards } from "./product-view";

const FIXTURES = ["welcome", "reply", "cards", "loading", "error", "cart"] as const;

export type AgentFixtureName = (typeof FIXTURES)[number];

export function readAgentFixture(search: string): AgentFixtureName | null {
  const value = new URLSearchParams(search).get("assistant-fixture");
  return FIXTURES.find((fixture) => fixture === value) ?? null;
}

const TEE_IMAGE =
  "https://cdn.shopify.com/s/files/1/0678/2474/6718/files/tafakkar-reflect-tfkr-t-shirt.jpg?v=1792620392";
const HOODIE_IMAGE =
  "https://cdn.shopify.com/s/files/1/0678/2474/6718/files/ana-ibn-jala-ana-abn-gla-otlaaa-althnaya-hoodie.jpg?v=1792866635";

const COLORS = ["White", "Natural", "Athletic Heather"] as const;
const SIZES = ["S", "M", "L", "XL", "2XL"] as const;

function fixtureTee(): AgentProductDetails {
  return {
    available: true,
    compareAtPrice: null,
    customDesign: false,
    description: "",
    handle: "tafakkar-t-shirt",
    image: TEE_IMAGE,
    images: [TEE_IMAGE],
    options: [
      { name: "Color", values: COLORS.map((name) => ({ name })) },
      { name: "Size", values: SIZES.map((name) => ({ name })) },
    ],
    price: { amount: "33.99", currencyCode: "USD" },
    title: "Tafakkar – Reflect (تفكّر) T-shirt",
    variants: COLORS.flatMap((color) =>
      SIZES.map((size) => ({
        available: true,
        compareAtPrice: null,
        id: "fixture",
        options: [
          { name: "Color", value: color },
          { name: "Size", value: size },
        ],
        price: { amount: "33.99", currencyCode: "USD" },
        requiresBundleConfiguration: false,
        requiresSellingPlan: false,
        title: `${color} / ${size}`,
      })),
    ),
    vendor: "Shirtat",
  };
}

const FIXTURE_CARDS: AgentProduct[] = [
  {
    available: true,
    compareAtPrice: null,
    handle: "tafakkar-t-shirt",
    image: TEE_IMAGE,
    price: { amount: "33.99", currencyCode: "USD" },
    title: "Tafakkar – Reflect (تفكّر) T-shirt",
    vendor: "Shirtat",
  },
  {
    available: true,
    compareAtPrice: null,
    handle: "ana-ibn-jala-hoodie",
    image: HOODIE_IMAGE,
    price: { amount: "64.99", currencyCode: "USD" },
    title: "Ana Ibn Jala (أنا ابن جلا وطلاع الثنايا) Hoodie",
    vendor: "Shirtat",
  },
];

export function AgentFixtureScene({
  followUp,
  kind,
}: {
  followUp: (text: string) => void;
  kind: AgentFixtureName;
}) {
  if (kind === "reply") return <FixtureReply followUp={followUp} />;
  if (kind === "cards") return <FixtureCards />;
  return null;
}

function FixtureReply({ followUp }: { followUp: (text: string) => void }) {
  const locale = useLocale();
  const copy =
    locale === "ar"
      ? "تفكّر كلمة بالكوفي الهندسي معناها التأمّل. القميص في البطاقة هو نفسه المعروض في المتجر الآن، والسعر منسوخ من صفحة المنتج لا من رد نموذج. إذا كانت هدية، قل لمن هي لأضيّق الألوان. هذا نص تجريبي طويل لتجربة التمرير: يبقى الكلام على خلفية اللوحة، وتبقى رسالتك أنت في فقاعة صغيرة، والاقتراحات التالية أزرار يمكنك لمسها دون أن تغادر المحادثة."
      : "Tafakkar is a geometric Kufic of the word “reflect”. The shirt on the card is the one in the shop now, and the price is copied from the product page, not from a model reply. If it is a gift, say who it is for and the colours can narrow. This is a long test paragraph so the panel can scroll: the reply sits on the paper background, your own note stays in a small bubble, and the next suggestions are buttons you can reach without leaving the conversation.";
  const options =
    locale === "ar" ? ["حبر أسود", "هدية", "هوديز"] : ["Black ink", "A gift", "Hoodies"];
  return (
    <div className="grid gap-8">
      <p className="text-base leading-7" dir="auto">
        {copy}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className="min-h-11 cursor-pointer rounded-full bg-[#efe6d2] px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e8]"
            key={option}
            onClick={() => followUp(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function FixtureCards() {
  const t = useT();
  const product = fixtureTee();
  const [selected, setSelected] = useState(() => defaultAgentSelection(product));
  const variant = findAgentVariant(product, selected);
  const price = variant?.price ?? product.price;
  return (
    <div className="grid gap-8">
      <p className="text-sm leading-7">{t("Here are two pieces from the shop.")}</p>
      <AgentProductCards products={FIXTURE_CARDS} />
      <AgentChooserBody
        onSelect={(name, value) =>
          setSelected((current) => selectAgentOption(product, current, name, value))
        }
        price={price}
        product={product}
        selected={selected}
      >
        <Button className="min-h-11 w-full" disabled type="button">
          {t("Add to Cart")}
        </Button>
        <p className="text-muted-foreground text-xs">
          {t("Test fixture. This preview does not change your cart.")}
        </p>
      </AgentChooserBody>
    </div>
  );
}
