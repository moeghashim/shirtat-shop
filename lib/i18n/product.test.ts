import assert from "node:assert/strict";
import test from "node:test";

import {
  dedupeDescriptionHtml,
  detectProductScript,
  localizeDescriptionText,
  productDocumentTitle,
  productHeading,
} from "./product";

const TAFAKKAR_HTML = `<p>Bold geometric Kufic “Tafakkar”: reflect, think.</p>
<p dir="rtl" lang="ar"><strong>تفكّر</strong><br />«تفكّر» بالخط الكوفي الهندسي العريض.</p>
<p>Design by Shirtat.</p>`;

const ADAB_HTML = `<p dir="rtl" lang="ar"><strong>الأدب</strong><br />لوحة خطية ذهبية طويلة لكلمة «الأدب».</p>`;

test("the bold Arabic lead is not repeated when the next words quote it", () => {
  const html = dedupeDescriptionHtml(TAFAKKAR_HTML);
  assert.equal(html.includes("<strong>تفكّر</strong>"), false);
  assert.match(html, /«تفكّر» بالخط الكوفي/);
  const text = localizeDescriptionText(TAFAKKAR_HTML, "ar");
  assert.equal(text.includes("تفكّر«تفكّر»"), false);
  assert.equal(text.includes("تفكّر تفكّر"), false);
  assert.match(text, /«تفكّر» بالخط الكوفي الهندسي العريض/);
});

test("a line break between Arabic words becomes a space, not a doubled word", () => {
  const text = localizeDescriptionText(ADAB_HTML, "en");
  assert.match(text, /الأدب لوحة/);
  assert.equal(text.includes("الأدبلوحة"), false);
  assert.match(text, /«الأدب»/);
});

test("product headings follow design, script, garment and Arabic calligraphy", () => {
  const source = "Bold geometric Kufic calligraphy. تفكّر بالخط الكوفي";
  const title = "Tafakkar – Reflect (تفكّر) T-shirt";
  assert.equal(
    productHeading(title, source, "en"),
    "Tafakkar (تفكّر) Kufic Arabic Calligraphy T-Shirt",
  );
  assert.equal(productHeading(title, source, "ar"), "تيشيرت «تفكّر» بالخط الكوفي");
  assert.equal(
    productDocumentTitle(productHeading(title, source, "ar"), "ar"),
    "تيشيرت «تفكّر» بالخط الكوفي | شيرتات",
  );
});

test("a script that the product text does not name is left out", () => {
  const title = "Ana Ibn Jala (أنا ابن جلا وطلاع الثنايا) T-shirt";
  const source = "Bold Arabic calligraphy of a famous line.";
  assert.equal(detectProductScript(source), undefined);
  assert.equal(
    productHeading(title, source, "en"),
    "Ana Ibn Jala (أنا ابن جلا وطلاع الثنايا) Arabic Calligraphy T-Shirt",
  );
  assert.equal(
    productHeading(title, source, "ar"),
    "تيشيرت «أنا ابن جلا وطلاع الثنايا» بالخط العربي",
  );
});

test("an English phrase product is not labeled as Arabic calligraphy", () => {
  const title = "Habibi, Call Me Senator T-Shirt";
  const source = "An original collegiate typography design.";
  assert.equal(productHeading(title, source, "en"), "Habibi, Call Me Senator T-Shirt");
  assert.equal(productHeading(title, source, "ar"), "تيشيرت Habibi, Call Me Senator");
});
