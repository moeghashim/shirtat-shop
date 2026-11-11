import { eq } from "drizzle-orm";

import { getAuth } from "@/lib/auth/auth.server";
import { inviteSignUp } from "@/lib/auth/invite-context";
import { isOwner } from "@/lib/auth/roles";
import { readAuthState } from "@/lib/auth/session.server";
import { authUser } from "@/server/db/auth-schema";
import { getDatabase } from "@/server/db/client.server";

import { randomBytes } from "node:crypto";

export async function inviteUser(input: { email: string; name: string; role: "designer" | "owner" }) {
  const authState = await readAuthState();
  if (authState.mode !== "auth" || !authState.user || !isOwner(authState.user)) {
    throw new Error("Only the owner can invite users.");
  }
  const auth = getAuth();
  if (!auth) throw new Error("Invites need BETTER_AUTH_SECRET and DATABASE_URL.");
  const email = input.email.toLowerCase();
  const password = randomBytes(18).toString("base64url");
  await inviteSignUp.run(true, () => auth.api.signUpEmail({ body: { email, name: input.name, password } }));
  await getDatabase()
    .update(authUser)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(authUser.email, email));
  return { email, password };
}

export async function ensureOwnerAccount(input: { email: string; name: string; password: string }) {
  const auth = getAuth();
  if (!auth) throw new Error("Set BETTER_AUTH_SECRET and DATABASE_URL before creating the owner.");
  const email = input.email.toLowerCase();
  const existing = await getDatabase()
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, email))
    .limit(1);
  if (existing.length === 0) {
    await inviteSignUp.run(true, () =>
      auth.api.signUpEmail({ body: { email, name: input.name, password: input.password } }),
    );
  }
  await getDatabase().update(authUser).set({ role: "owner", updatedAt: new Date() }).where(eq(authUser.email, email));
  return { created: existing.length === 0, email };
}
