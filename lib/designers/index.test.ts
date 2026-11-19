import assert from "node:assert/strict";
import test from "node:test";

import {
  designerHandleFromTags,
  publicDesignerCredits,
  resolveDesignerCredit,
  SHIRTAT_DESIGNER,
} from "./index";

const NIHAD = { handle: "nihad", name: "Nihad Taisir" };

test("a designer: tag resolves to that public designer", () => {
  const credit = resolveDesignerCredit(
    ["category:cultures", "Designer:Nihad", "supplier:printify"],
    [NIHAD],
  );
  assert.deepEqual(credit, NIHAD);
  assert.equal(designerHandleFromTags(["designer:nihad"]), "nihad");
});

test("a legacy creator: tag is used when the product has no designer: tag", () => {
  assert.deepEqual(resolveDesignerCredit(["creator:nihad"], [NIHAD]), NIHAD);
  assert.equal(designerHandleFromTags(["  creator:nihad  "]), "nihad");
});

test("designer: wins over a different creator: tag", () => {
  const credit = resolveDesignerCredit(
    ["creator:other", "designer:nihad"],
    [{ handle: "other", name: "Other" }, NIHAD],
  );
  assert.equal(credit.handle, "nihad");
});

test("an unusable designer: tag falls through to a valid creator: tag", () => {
  assert.equal(designerHandleFromTags(["designer:not a handle", "creator:nihad"]), "nihad");
  assert.equal(designerHandleFromTags(["designer:"]), undefined);
});

test("no tag, the studio tag, or an unknown designer falls back to Shirtat", () => {
  assert.deepEqual(resolveDesignerCredit([], [NIHAD]), SHIRTAT_DESIGNER);
  assert.deepEqual(resolveDesignerCredit(["category:humor"], [NIHAD]), SHIRTAT_DESIGNER);
  assert.equal(resolveDesignerCredit(["designer:shirtat"], [NIHAD]).handle, "shirtat");
  assert.equal(resolveDesignerCredit(["creator:shirtat"], []).name, "Shirtat");
  assert.equal(resolveDesignerCredit(["designer:missing"], [NIHAD]).handle, "shirtat");
  assert.equal(resolveDesignerCredit(["designer:missing"], [NIHAD]).nameAr, "شِرتات");
});

test("only approved, visible designers with a handle can be credited", () => {
  const credits = publicDesignerCredits([
    {
      details: { displayName: "Nihad Taisir" },
      handle: "nihad",
      name: "Nihad",
      status: "approved",
    },
    { handle: "hidden", hiddenFromDirectory: true, name: "Hidden", status: "approved" },
    { handle: "pending", name: "Pending", status: "pending" },
    { handle: "shirtat", name: "Shirtat", status: "approved" },
    { handle: null, name: "No handle", status: "approved" },
    { details: { displayName: "" }, handle: "blank", name: "Blank Name", status: "approved" },
  ]);
  assert.deepEqual(credits, [
    { handle: "nihad", name: "Nihad Taisir" },
    { handle: "blank", name: "Blank Name" },
  ]);
  assert.equal(resolveDesignerCredit(["designer:hidden"], credits).handle, "shirtat");
  assert.equal(resolveDesignerCredit(["designer:pending"], credits).handle, "shirtat");
});
