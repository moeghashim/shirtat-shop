import assert from "node:assert/strict";
import test from "node:test";

import { linkProductMentions } from "./index";

test("making-of and roadmap names link only to products that exist", () => {
  const english = linkProductMentions(
    "New design: Ana Ibn Jala (أنا ابن جلا وطلاع الثنايا), and Habibi, Call Me Senator is live. A fictional Tee of Nowhere is not.",
  );
  const hrefs = english.flatMap((part) => (part.href ? [part.href] : []));
  assert.deepEqual(hrefs, [
    "/products/ana-ibn-jala-t-shirt",
    "/products/ana-ibn-jala-t-shirt",
    "/products/habibi-call-me-senator-t-shirt",
  ]);
  assert.equal(
    english.some((part) => part.text.includes("Tee of Nowhere") && part.href),
    false,
  );

  const arabic = linkProductMentions("تصميم جديد: «أنا ابن جلا» ومجموعة «بيني وبينك».");
  assert.deepEqual(
    arabic.filter((part) => part.href).map((part) => part.text),
    ["أنا ابن جلا", "بيني وبينك"],
  );
});
