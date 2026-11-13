import { useState } from "react";

import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

import { DashboardCard, SectionHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

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

/** Creates an admin-app login (designer or owner). Separate from storefront designer applications. */
export function InviteCard() {
  const [password, setPassword] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <DashboardCard>
      <SectionHeader
        title="Invite to this admin"
        description="Creates a login for admin.shirtat.co. The password is shown once and is not stored on this page."
      />
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
                setError("The invite did not go through. Check that this email is new and the database is migrated.");
              })
              .finally(() => setPending(false));
          }}
        >
          <label className="grid gap-1 text-sm" htmlFor="invite-name">
            Name
            <Input autoComplete="name" id="invite-name" name="name" required />
          </label>
          <label className="grid gap-1 text-sm" htmlFor="invite-email">
            Email
            <Input autoComplete="off" id="invite-email" name="email" required type="email" />
          </label>
          <label className="flex flex-col gap-1 text-sm" htmlFor="invite-role">
            Role
            <NativeSelect defaultValue="designer" id="invite-role" name="role">
              <NativeSelectOption value="designer">Designer</NativeSelectOption>
              <NativeSelectOption value="owner">Owner</NativeSelectOption>
            </NativeSelect>
          </label>
          <Button disabled={pending} type="submit">
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
  );
}
