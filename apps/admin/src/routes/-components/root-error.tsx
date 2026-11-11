import { type ErrorComponentProps, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { APP_LANDING_ROUTE } from "@/navigation/landing";

export function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-2xl font-medium">Something went wrong.</h1>
        <p className="text-muted-foreground text-sm">
          An unexpected error occurred while loading this page. Try again or return to the dashboard.
        </p>
        {import.meta.env.DEV ? (
          <p className="text-destructive text-sm wrap-anywhere">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button nativeButton={false} variant="outline" render={<Link to={APP_LANDING_ROUTE} replace />}>
          Go to dashboard
        </Button>
      </div>
    </main>
  );
}
