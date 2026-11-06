import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { categoryCollection, getCategory } from "../collections/categories";
import { isSenatorCampaignProduct, SENATOR_HEADING, SENATOR_PHRASE, senatorSlots } from "./senator";

describe("politics category", () => {
  it("uses the Politics label and an Arabic label", () => {
    const category = getCategory("politics");
    assert.equal(category?.labelEn, "Politics");
    assert.equal(category?.labelAr, "سياسة");
    assert.equal(categoryCollection("politics", "en")?.path, "/collections/politics");
    assert.equal(categoryCollection("politics", "ar")?.title, "سياسة");
    assert.equal(categoryCollection("politics", "AR")?.title, "سياسة");
    assert.equal("id" in (categoryCollection("politics", "en") ?? {}), false);
    assert.equal(categoryCollection("not-a-category", "en"), undefined);
  });
});

describe("Habibi, Call Me Senator", () => {
  it("keeps the English heading and phrase", () => {
    assert.equal(SENATOR_HEADING, "Habibi, Call Me Senator");
    assert.equal(SENATOR_PHRASE, "HABIBI CALL ME SENATOR");
  });

  it("does not treat nearby catalog products as the campaign", () => {
    const slots = senatorSlots([
      {
        handle: "al-hubb-wal-salam-hoodie",
        productType: "Hoodie",
        title: "Al Hubb wal Salam Hoodie",
      },
      { handle: "tafakkar-cap", productType: "Cap", title: "Tafakkar Dad cap" },
      { handle: "al-adab-t-shirt", productType: "T-Shirt", title: "Al Adab T-shirt" },
      { handle: "custom-mug", productType: "Mug", title: "Custom Calligraphy Mug" },
    ]);
    assert.deepEqual(
      slots.map((slot) => slot.product),
      [null, null, null, null],
    );
    assert.equal(isSenatorCampaignProduct({ handle: "habibi-ya", title: "Ya Habibi" }), false);
  });

  it("fills only a real matching type and leaves the rest empty", () => {
    const slots = senatorSlots([
      {
        handle: "habibi-call-me-senator-t-shirt",
        productType: "T-Shirt",
        title: "Habibi, Call Me Senator T-shirt",
      },
      {
        handle: "habibi-call-me-senator-kids-t-shirt",
        productType: "Kids T-Shirt",
        title: "Habibi, Call Me Senator Kids T-shirt",
      },
      {
        handle: "habibi-call-me-senator-hoodie",
        productType: "Hoodie",
        title: "HABIBI CALL ME SENATOR Hoodie",
      },
    ]);
    assert.deepEqual(
      slots.map((slot) => [slot.id, slot.product?.handle ?? null]),
      [
        ["cap", null],
        ["hoodie", "habibi-call-me-senator-hoodie"],
        ["mug", null],
        ["t-shirt", "habibi-call-me-senator-t-shirt"],
      ],
    );
  });
});
