import { redirect } from "@tanstack/react-router";

import { authDestination } from "./redirect";
import { getAuthState } from "./server-functions";

export async function loadAuthRoute({ search }: { search: { redirect?: string } }) {
  const auth = await getAuthState();
  const destination = authDestination(search.redirect);
  if (auth.mode === "auth" && auth.user) throw redirect({ href: destination, replace: true });
  return { auth, destination };
}
