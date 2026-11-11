import { createFileRoute } from "@tanstack/react-router";

import { loadAuthRoute } from "@/lib/auth/auth-route";
import { authSearch } from "@/lib/auth/redirect";

import { AuthFlow } from "../../-components/auth-flow";
import { LoginForm } from "../../-components/login-form";
import { AuthFrame } from "../-components/auth-frame";

export const Route = createFileRoute("/(main)/auth/v2/login")({
  validateSearch: authSearch,
  beforeLoad: loadAuthRoute,
  component: LoginV2,
});

function LoginV2() {
  const { auth, destination } = Route.useRouteContext();
  const search = Route.useSearch();
  return (
    <AuthFlow auth={auth} destination={destination} oauthError={!!search.error}>
      <AuthFrame mode="login">
        <LoginForm />
      </AuthFrame>
    </AuthFlow>
  );
}
