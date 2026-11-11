import { createFileRoute, redirect } from "@tanstack/react-router";

import { authSearch } from "@/lib/auth/redirect";

export const Route = createFileRoute("/(main)/auth/v1/login")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/auth/v2/login",
      search: authSearch(location.search),
      hash: location.hash,
      statusCode: 308,
      replace: true,
    });
  },
});
