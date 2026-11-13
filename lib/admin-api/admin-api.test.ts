import assert from "node:assert/strict";
import test from "node:test";

import { ADMIN_API_HEADERS, signAdminRequest, verifyAdminRequest } from "./signature";
import { adminRedirects } from "./urls";

const secret = "s".repeat(20) + "e".repeat(20) + "c".repeat(8);
const now = 1_794_600_000;
const body = new TextEncoder().encode("id=abc&status=approved");
const base = {
  actor: "Moe@10claws.com",
  body,
  method: "POST",
  path: "/api/internal/admin/designers?op=update",
  secret,
};

function headersFor(input = base, timestamp = now) {
  return new Headers(signAdminRequest({ ...input, timestamp }));
}

test("a signed owner request verifies and names the actor", () => {
  const result = verifyAdminRequest({ ...base, headers: headersFor(), now });
  assert.deepEqual(result, { actor: "moe@10claws.com", ok: true });
});

test("tampering with the body, path, method, actor or secret is rejected", () => {
  const headers = headersFor();
  const reject = (input: Partial<Parameters<typeof verifyAdminRequest>[0]>) =>
    verifyAdminRequest({ ...base, headers, now, ...input }).ok;
  assert.equal(reject({ body: new TextEncoder().encode("id=abc&status=rejected") }), false);
  assert.equal(reject({ path: "/api/internal/admin/designers?op=delete" }), false);
  assert.equal(reject({ method: "GET" }), false);
  assert.equal(reject({ secret: `${secret}x` }), false);
  const forged = new Headers(headers);
  forged.set(ADMIN_API_HEADERS.actor, "someone@example.com");
  assert.equal(reject({ headers: forged }), false);
});

test("stale, unsigned and unconfigured requests are rejected", () => {
  assert.deepEqual(verifyAdminRequest({ ...base, headers: headersFor(base, now - 301), now }), {
    ok: false,
    reason: "stale",
  });
  assert.deepEqual(verifyAdminRequest({ ...base, headers: new Headers(), now }), {
    ok: false,
    reason: "missing",
  });
  assert.deepEqual(verifyAdminRequest({ ...base, headers: headersFor(), now, secret: "short" }), {
    ok: false,
    reason: "not_configured",
  });
  assert.deepEqual(verifyAdminRequest({ ...base, headers: headersFor(), now, secret: undefined }), {
    ok: false,
    reason: "not_configured",
  });
  assert.throws(() => signAdminRequest({ ...base, secret: "short", timestamp: now }));
});

test("old storefront admin pages redirect to the admin app in both locales", () => {
  const rules = adminRedirects("https://admin.shirtat.co");
  const find = (source: string) => rules.find((rule) => rule.source === source)?.destination;
  assert.equal(find("/admin/creators"), "https://admin.shirtat.co/dashboard/designers");
  assert.equal(find("/ar/admin/creators"), "https://admin.shirtat.co/dashboard/designers");
  assert.equal(find("/admin/chats"), "https://admin.shirtat.co/dashboard/chats");
  assert.equal(
    find("/admin/chats/:sessionId"),
    "https://admin.shirtat.co/dashboard/chats/:sessionId",
  );
  assert.equal(find("/ar/admin/seo"), "https://admin.shirtat.co/dashboard/seo");
  assert.equal(find("/admin/:path*"), "https://admin.shirtat.co/dashboard/designers");
  assert.ok(rules.every((rule) => rule.permanent === false));
});
