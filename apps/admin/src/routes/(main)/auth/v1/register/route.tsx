import { createFileRoute, redirect } from "@tanstack/react-router";

import { authSearch } from "@/lib/auth/redirect";

export const Route = createFileRoute("/(main)/auth/v1/register")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/auth/v2/register",
      search: authSearch(location.search),
      hash: location.hash,
      statusCode: 308,
      replace: true,
    });
  },
});
