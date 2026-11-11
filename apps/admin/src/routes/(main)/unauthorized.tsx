import { createFileRoute, Link } from "@tanstack/react-router";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(main)/unauthorized")({ component: Page });

function Page() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="max-w-sm space-y-3">
        <Lock aria-hidden="true" className="text-muted-foreground mx-auto size-6" />
        <h1 className="text-2xl font-medium">Unauthorized Access</h1>
        <p className="text-muted-foreground text-sm">
          You do not have permission to view the requested content. Contact the site administrator if you believe this
          is an error.
        </p>
      </div>
      <Button nativeButton={false} variant="outline" render={<Link to="/dashboard/designers" />}>
        Go to dashboard
      </Button>
    </main>
  );
}
