import { isOwner } from "@/lib/auth/roles";
import { readAuthState } from "@/lib/auth/session.server";

export async function assertSeoReader() {
  const auth = await readAuthState();
  if (auth.mode === "demo") return auth;
  if (auth.user && isOwner(auth.user)) return auth;
  throw new Error("SEO is limited to the owner.");
}
