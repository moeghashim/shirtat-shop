import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { APP_LANDING_ROUTE } from "@/navigation/landing";

export function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-medium">Page not found.</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        This address does not match a page. Check the URL or return to the dashboard.
      </p>
      <Button nativeButton={false} variant="outline" render={<Link to={APP_LANDING_ROUTE} replace />}>
        Go to dashboard
      </Button>
    </main>
  );
}
