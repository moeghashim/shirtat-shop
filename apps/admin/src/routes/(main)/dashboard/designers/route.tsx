import { createFileRoute } from "@tanstack/react-router";

import { DashboardCard, PageHeader, SectionHeader } from "@/components/blocks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CardContent } from "@/components/ui/card";
import { isOwner } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/server-functions";

import { DesignersAdmin } from "./-components/designers-admin";
import { loadDesigners } from "./-components/functions";
import { InviteCard } from "./-components/invite-card";

export const Route = createFileRoute("/(main)/dashboard/designers")({
  loader: async () => {
    const auth = await getAuthState();
    const demo = auth.mode === "demo";
    const owner = demo || Boolean(auth.user && isOwner(auth.user));
    return { demo, owner, designers: owner ? await loadDesigners() : null };
  },
  component: DesignersPage,
});

function DesignersPage() {
  const { demo, owner, designers } = Route.useLoaderData();
  if (!owner) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Designers" description="Designer tools will live here." />
        <DashboardCard>
          <SectionHeader title="Coming next" description="No designer tools are wired up yet." />
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Your designer dashboard is on shirtat.co for now:{" "}
              <a className="underline" href="https://shirtat.co/creators/dashboard">
                shirtat.co/creators/dashboard
              </a>
              .
            </p>
          </CardContent>
        </DashboardCard>
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {designers?.data ? (
        <DesignersAdmin view={designers.data} />
      ) : (
        <>
          <PageHeader title="Designers" description="Applications, approvals and designer sales from shirtat.co." />
          <Alert variant="destructive">
            <AlertTitle>Designer data did not load</AlertTitle>
            <AlertDescription>{designers?.error ?? "The storefront could not be reached."}</AlertDescription>
          </Alert>
        </>
      )}
      {demo ? (
        <p className="text-muted-foreground text-sm">
          Invites turn on when BETTER_AUTH_SECRET and DATABASE_URL are set. This local demo stays open.
        </p>
      ) : (
        <InviteCard />
      )}
    </div>
  );
}
