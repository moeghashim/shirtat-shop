import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

import { isOwner } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/server-functions";

import { SeoDashboard } from "./-components/seo-dashboard";

const seoQuerySchema = z.object({
  area: z.string().optional(),
  owner: z.string().optional(),
  phase: z.string().optional(),
  status: z.string().optional(),
  window: z.string().optional(),
});

export const loadSeoDashboard = createServerFn({ method: "GET" })
  .validator((input: unknown) => seoQuerySchema.parse(input))
  .handler(async ({ data }) => {
    const { assertSeoReader } = await import("@/server/seo/access.server");
    await assertSeoReader();
    const { readSeoDashboard } = await import("@/server/seo/read.server");
    return readSeoDashboard(data);
  });

export const Route = createFileRoute("/(main)/dashboard/seo")({
  validateSearch: (search) => seoQuerySchema.parse(search),
  beforeLoad: async () => {
    const auth = await getAuthState();
    if (auth.mode === "auth" && auth.user && !isOwner(auth.user)) {
      throw redirect({ to: "/dashboard/designers", replace: true });
    }
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadSeoDashboard({ data: deps }),
  component: SeoPage,
});

function SeoPage() {
  return <SeoDashboard data={Route.useLoaderData()} search={Route.useSearch()} />;
}
