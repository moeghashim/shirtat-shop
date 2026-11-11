import type { ReactNode } from "react";

import { getRouteApi } from "@tanstack/react-router";

import { Globe } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand";

import { useAuthFlow } from "../../-components/auth-flow";
import { ProviderControls } from "../../-components/social-auth/provider-controls";

const route = getRouteApi("/(main)/auth/v2");

export function AuthFrame({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  const { copyright } = route.useLoaderData();
  const { auth } = useAuthFlow();
  const login = mode === "login";
  const demoDescription = login ? "Enter your details to try the demo." : "Enter your details to explore the demo.";
  return (
    <div className="flex min-h-dvh flex-1 flex-col gap-8 px-6 py-6 sm:px-10">
      <nav aria-label="Account" className="text-muted-foreground text-right text-sm">
        Accounts are invite-only.
      </nav>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-4">
        <div className="space-y-2">
          <BrandLogo className="text-foreground h-14 lg:hidden" />
          <h1 className="text-2xl font-medium">{login ? "Login to your account" : "Create your account"}</h1>
          <p className="text-muted-foreground text-sm">
            {auth.mode === "auth" ? "Enter your details to continue." : demoDescription}
          </p>
        </div>
        <div className="space-y-4">
          <ProviderControls divider />
          {children}
        </div>
      </div>
      <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
        <span>{copyright}</span>
        <span className="flex items-center gap-1">
          <Globe aria-hidden="true" className="size-4" />
          ENG
        </span>
      </footer>
    </div>
  );
}
