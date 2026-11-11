import { createFileRoute, redirect } from "@tanstack/react-router";

import { isOwner } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/server-functions";
import { APP_LANDING_ROUTE } from "@/navigation/landing";

export const Route = createFileRoute("/(external)/")({
  beforeLoad: async () => {
    const auth = await getAuthState();
    const href = auth.mode === "auth" && auth.user && !isOwner(auth.user) ? "/dashboard/designers" : APP_LANDING_ROUTE;
    throw redirect({ href, replace: true });
  },
});
