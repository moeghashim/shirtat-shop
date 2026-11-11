import { OWNER_EMAIL } from "../src/lib/auth/roles.ts";
import { ensureOwnerAccount } from "../src/server/auth/invite.server.ts";

const email = process.env.OWNER_EMAIL?.trim() || OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;
if (!password) {
  console.error("Set OWNER_PASSWORD in the environment. The password is never printed.");
  process.exit(1);
}

const result = await ensureOwnerAccount({ email, name: "Moe", password });
console.log(result.created ? `Owner created for ${result.email}.` : `Owner role set for ${result.email}.`);
