import { redirect } from "@tanstack/react-router";

import { authDestination } from "./redirect";
import { getAuthState } from "./server-functions";

export async function requireAppRoute({ location }: { location: { href: string } }) {
  const auth = await getAuthState();
  if (auth.mode === "auth" && !auth.user) {
    throw redirect({ to: "/auth/v2/login", search: { redirect: authDestination(location.href) }, replace: true });
  }
  return { auth };
}
