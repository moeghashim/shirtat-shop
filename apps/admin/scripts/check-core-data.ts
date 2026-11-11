import { dbAnalytics, demoAnalytics } from "../src/server/data/analytics.ts";
import { previousMonth } from "../src/server/data/core-dates.ts";
import { dbCrm, demoCrm } from "../src/server/data/crm.ts";
import { dbDefault, demoDefault } from "../src/server/data/default.ts";
import { dbFinance, demoFinance } from "../src/server/data/finance.ts";
import { closeDatabase } from "../src/server/db/client.server.ts";
import assert from "node:assert/strict";

assert.equal(previousMonth("2026-12-31T23:59:59Z"), "November");
assert.equal(previousMonth("2027-03-31T23:59:59Z"), "February");
assert.equal(previousMonth("2028-03-31T23:59:59Z"), "February");

console.log("PASS month-end CRM labels preserve clamped December/March subtraction");

const renderedAt = "2028-02-29T23:59:59Z";
try {
  for (const [source, reads] of [
    ["demo", [demoDefault, demoCrm, demoFinance, demoAnalytics]],
    ["db", [dbDefault, dbCrm, dbFinance, dbAnalytics]],
  ] as const) {
    const [defaults, crm, finance, analytics] = reads;
    {
      const input = { renderedAt, id: "missing" };
      const a = await defaults(input),
        b = await crm(input),
        c = await finance(input),
        d = await analytics(input);
      assert.equal(a.current.recordsCustomers.length, 0);
      assert.equal(b.current.recordsOpportunities.length, 0);
      assert.equal(c.current.walletWalletCards.length, 0);
      assert.equal(d.current.topPagesPages.length, 0);
      for (const read of reads) await assert.rejects(() => read({ renderedAt: "not-a-date" }));
    }
    console.log(`PASS ${source}: current screens return empty missing-ID records and reject invalid timestamps`);
  }
} finally {
  await closeDatabase();
}
