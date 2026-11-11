import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

import { DashboardCard, PageHeader, SectionHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isOwner } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/server-functions";

const inviteSchema = z
  .object({
    email: z.email(),
    name: z.string().trim().min(1).max(100),
    role: z.enum(["designer", "owner"]),
  })
  .strict();

const inviteDesigner = createServerFn({ method: "POST" })
  .validator((input: unknown) => inviteSchema.parse(input))
  .handler(async ({ data }) => {
    const { inviteUser } = await import("@/server/auth/invite.server");
    return inviteUser(data);
  });

export const Route = createFileRoute("/(main)/dashboard/designers")({
  loader: async () => {
    const auth = await getAuthState();
    return {
      demo: auth.mode === "demo",
      owner: auth.mode === "demo" || Boolean(auth.user && isOwner(auth.user)),
    };
  },
  component: DesignersPage,
});

function DesignersPage() {
  const { demo, owner } = Route.useLoaderData();
  const [password, setPassword] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Designers"
        description="Designer dashboards will live here. Add one with npm run new:dashboard."
      />
      <DashboardCard>
        <SectionHeader title="Coming next" description="No designer tools are wired up yet." />
        <CardContent>
          <p className="text-muted-foreground text-sm">This page is the landing place for a designer role.</p>
        </CardContent>
      </DashboardCard>
      {owner && !demo ? (
        <DashboardCard>
          <SectionHeader title="Invite" description="The password is shown once and is not stored on this page." />
          <CardContent>
            <form
              className="grid max-w-md gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const formElement = event.currentTarget;
                const form = new FormData(formElement);
                const parsed = inviteSchema.safeParse({
                  email: form.get("email"),
                  name: form.get("name"),
                  role: form.get("role"),
                });
                if (!parsed.success) {
                  setError("Enter a name, a valid email and a role.");
                  setPassword(null);
                  return;
                }
                setPending(true);
                setError(null);
                void inviteDesigner({ data: parsed.data })
                  .then((result) => {
                    setEmail(result.email);
                    setPassword(result.password);
                    formElement.reset();
                  })
                  .catch(() => {
                    setPassword(null);
                    setError(
                      "The invite did not go through. Check that this email is new and the database is migrated.",
                    );
                  })
                  .finally(() => setPending(false));
              }}
            >
              <label className="grid gap-1 text-sm" htmlFor="invite-name">
                Name
                <Input id="invite-name" name="name" required autoComplete="name" />
              </label>
              <label className="grid gap-1 text-sm" htmlFor="invite-email">
                Email
                <Input id="invite-email" name="email" type="email" required autoComplete="off" />
              </label>
              <label className="grid gap-1 text-sm" htmlFor="invite-role">
                Role
                <select
                  className="border-input bg-background h-9 rounded-md border px-3"
                  defaultValue="designer"
                  id="invite-role"
                  name="role"
                >
                  <option value="designer">Designer</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
              <Button type="submit" disabled={pending}>
                {pending ? "Inviting" : "Create invite"}
              </Button>
              {error ? <p className="text-sm">{error}</p> : null}
              {password && email ? (
                <p className="text-sm" dir="auto">
                  {email} can sign in with this password: {password}
                </p>
              ) : null}
            </form>
          </CardContent>
        </DashboardCard>
      ) : null}
      {demo ? (
        <p className="text-muted-foreground text-sm">
          Invites turn on when BETTER_AUTH_SECRET and DATABASE_URL are set. This local demo stays open.
        </p>
      ) : null}
    </div>
  );
}
