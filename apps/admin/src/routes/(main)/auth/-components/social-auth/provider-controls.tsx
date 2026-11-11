import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";

import { useAuthFlow, useProviderSignIn } from "../auth-flow";
import { GoogleButton } from "./google-button";

export function ProviderControls({ divider = false }: { divider?: boolean }) {
  const { auth, pending } = useAuthFlow();
  const start = useProviderSignIn();
  const google = auth.mode === "auth" && auth.providers.google;
  const github = auth.mode === "auth" && auth.providers.github;
  if (!google && !github) return null;
  return (
    <div className="space-y-3">
      {google && (
        <GoogleButton
          type="button"
          className="w-full"
          variant="outline"
          disabled={pending}
          onClick={() => void start("google")}
        />
      )}
      {github && (
        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={pending}
          onClick={() => void start("github")}
        >
          <SimpleIcon icon={siGithub} className="size-4" />
          Continue with GitHub
        </Button>
      )}
      {divider && (
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="bg-border h-px flex-1" />
          Or continue with
          <span className="bg-border h-px flex-1" />
        </div>
      )}
    </div>
  );
}
