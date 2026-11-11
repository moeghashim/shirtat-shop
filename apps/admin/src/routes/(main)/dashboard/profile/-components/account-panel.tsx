import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AccountDetails } from "@/lib/auth/account.server";
import { getAccountDetails, revokeAccountSession } from "@/lib/auth/account-functions";
import { authClient, authError } from "@/lib/auth/client";
import { accountName } from "@/lib/auth/name";

type ReadyAccount = Extract<AccountDetails, { status: "ready" }>;
const accountReturn = "/auth/v2/login?redirect=%2Fdashboard%2Fprofile%3Ftab%3Daccount";

function Reauthenticate() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="space-y-3">
      <p>For your security, sign in again to manage your active sessions.</p>
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error();
            window.location.replace(accountReturn);
          } catch {
            setError(authError());
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : "Sign in again"}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function AccountPanel() {
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const alive = useRef<boolean>(false);
  const router = useRouter();
  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const result = await getAccountDetails();
      if (alive.current) setAccount(result);
    } catch {
      if (alive.current) setError("Account details are unavailable. Check your connection and retry.");
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);
  function content() {
    if (loading) return <p role="status">Loading account details…</p>;
    if (error)
      return (
        <div className="space-y-3">
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
          <Button variant="outline" onClick={() => void load()}>
            Retry account details
          </Button>
        </div>
      );
    if (account?.status === "reauth") return <Reauthenticate />;
    if (account?.status !== "ready") return <p role="status">No active sign-in account. Sign in again to continue.</p>;
    return (
      <>
        <NameForm
          user={account.user}
          onSaved={async () => {
            await router.invalidate();
            await load(false);
          }}
        />
        {account.hasPassword ? (
          <PasswordForm onSaved={() => load(false)} />
        ) : (
          <section className="space-y-2 border-t pt-6" aria-labelledby="account-password-heading">
            <h3 id="account-password-heading" className="font-medium">
              Password
            </h3>
            <p className="text-muted-foreground text-sm">
              You sign in through a provider. Manage your password with that provider.
            </p>
          </section>
        )}
        <SessionList
          sessions={account.sessions}
          refresh={() => load(false)}
          reauthenticate={() => setAccount({ status: "reauth" })}
        />
      </>
    );
  }
  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your sign-in account</h2>
        <p className="text-muted-foreground text-sm">Manage your name, password and browsers signed in to tenboards.</p>
      </div>
      {content()}
    </div>
  );
}

function NameForm({ user, onSaved }: { user: ReadyAccount["user"]; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef<boolean>(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        setError("");
        setSuccess("");
        const validated = accountName(name);
        if (!validated) {
          setError("Enter a name of 1–100 characters.");
          input.current?.focus();
          return;
        }
        busy.current = true;
        setPending(true);
        try {
          const result = await authClient.updateUser({ name: validated });
          if (result.error) {
            setError(authError(result.error));
            input.current?.focus();
          } else {
            setName(validated);
            await onSaved();
            setSuccess("Name saved.");
          }
        } catch {
          setError(authError());
          input.current?.focus();
        } finally {
          busy.current = false;
          setPending(false);
        }
      }}
    >
      <h3 className="font-medium">Account details</h3>
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="account-name">Name</FieldLabel>
        <Input
          ref={input}
          id="account-name"
          name="name"
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "account-name-error" : undefined}
        />
        {error && (
          <FieldError id="account-name-error" role="alert">
            {error}
          </FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="account-email">Email</FieldLabel>
        <Input id="account-email" value={user.email} readOnly autoComplete="email" />
        <p className="text-muted-foreground text-sm">Email changes are not available.</p>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving name…" : "Save name"}
      </Button>
      <p role="status" className="text-sm">
        {pending ? "Saving name." : success}
      </p>
    </form>
  );
}

function PasswordForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef<boolean>(false);
  const [field, setField] = useState("");
  return (
    <form
      noValidate
      className="space-y-4 border-t pt-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const currentPassword = String(data.get("currentPassword") ?? "");
        const newPassword = String(data.get("newPassword") ?? "");
        const confirmation = String(data.get("confirmation") ?? "");
        setError("");
        setSuccess("");
        setField("");
        const fail = (message: string, name: string) => {
          setError(message);
          setField(name);
          (form.elements.namedItem(name) as HTMLInputElement)?.focus();
        };
        if (!currentPassword) {
          fail("Enter your current password.", "currentPassword");
          return;
        }
        if (newPassword.length < 8 || newPassword.length > 128) {
          fail("Use 8–128 characters for your new password.", "newPassword");
          return;
        }
        if (confirmation !== newPassword) {
          fail("Passwords do not match.", "confirmation");
          return;
        }
        busy.current = true;
        setPending(true);
        try {
          const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
          if (result.error) fail(authError(result.error), "currentPassword");
          else {
            form.reset();
            await onSaved();
            setSuccess("Password changed. Other browsers have been signed out.");
          }
        } catch {
          fail(authError(), "currentPassword");
        } finally {
          busy.current = false;
          setPending(false);
        }
      }}
    >
      <div className="space-y-2">
        <h3 className="font-medium">Change password</h3>
        <p className="text-muted-foreground text-sm">
          Changing your password signs out your other sessions. This browser stays signed in with a new session.
        </p>
      </div>
      {(
        [
          ["currentPassword", "Current password", "current-password"],
          ["newPassword", "New password", "new-password"],
          ["confirmation", "Confirm new password", "new-password"],
        ] as const
      ).map(([name, label, autoComplete]) => (
        <Field key={name} data-invalid={field === name}>
          <FieldLabel htmlFor={`account-${name}`}>{label}</FieldLabel>
          <Input
            id={`account-${name}`}
            name={name}
            type="password"
            autoComplete={autoComplete}
            maxLength={128}
            aria-invalid={field === name}
            aria-describedby={field === name ? "account-password-error" : undefined}
          />
        </Field>
      ))}
      {error && (
        <FieldError id="account-password-error" role="alert">
          {error}
        </FieldError>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Changing password…" : "Change password"}
      </Button>
      <p role="status" className="text-sm">
        {pending ? "Changing password." : success}
      </p>
    </form>
  );
}

function SessionList({
  sessions,
  refresh,
  reauthenticate,
}: {
  sessions: ReadyAccount["sessions"];
  refresh: () => Promise<void>;
  reauthenticate: () => void;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const cancel = useRef<HTMLButtonElement>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const busy = useRef<boolean>(false);
  useEffect(() => {
    if (confirm) cancel.current?.focus();
  }, [confirm]);
  return (
    <section className="space-y-4 border-t pt-6" aria-labelledby="account-sessions-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="account-sessions-heading" className="font-medium">
          Active sessions
        </h3>
        <Button
          ref={refreshButton}
          variant="outline"
          disabled={pending}
          onClick={async () => {
            setError("");
            await refresh();
          }}
        >
          Refresh sessions
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Browser details are provided by the device and may be unavailable. Revoke a session you no longer use.
      </p>
      {sessions.length ? (
        <ul className="divide-y">
          {sessions.map((session) => (
            <li key={session.id} className="space-y-3 py-4" data-session-id={session.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium wrap-anywhere">{session.description}</p>
                  {session.current && <p className="text-sm font-medium">Current session</p>}
                  <p className="text-muted-foreground text-xs">
                    Created {new Date(session.createdAt).toLocaleString()}
                    <br />
                    Expires {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  className="self-start"
                  ref={(el) => {
                    if (el) triggers.current.set(session.id, el);
                    else triggers.current.delete(session.id);
                  }}
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setConfirm(session.id);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Revoke{session.current ? " current session" : " session"}
                </Button>
              </div>
              {confirm === session.id && (
                <fieldset className="space-y-3 rounded-lg border p-3" aria-labelledby={`revoke-${session.id}`}>
                  <p id={`revoke-${session.id}`} className="text-sm wrap-anywhere">
                    Revoke {session.current ? "this current session" : session.description}?{" "}
                    {session.current
                      ? "You will be signed out of this browser."
                      : "That browser will need to sign in again."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      ref={cancel}
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setConfirm(null);
                        triggers.current.get(session.id)?.focus();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={pending}
                      onClick={async () => {
                        if (busy.current) return;
                        busy.current = true;
                        setPending(true);
                        setError("");
                        try {
                          const result = await revokeAccountSession({ data: { id: session.id } });
                          if (result.status === "reauth") {
                            reauthenticate();
                            return;
                          }
                          if (result.status === "unavailable") {
                            setError("This session is no longer available. Refresh the list.");
                            return;
                          }
                          if (result.current) {
                            window.location.replace(accountReturn);
                            return;
                          }
                          setConfirm(null);
                          await refresh();
                          setSuccess("Session revoked.");
                          refreshButton.current?.focus();
                        } catch {
                          setError("Unable to revoke this session. Check your connection and retry.");
                        } finally {
                          busy.current = false;
                          setPending(false);
                        }
                      }}
                    >
                      {pending ? "Revoking…" : "Confirm revocation"}
                    </Button>
                  </div>
                </fieldset>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">No active sessions remain. Sign in again to continue.</p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <p role="status" className="text-sm">
        {pending ? "Revoking session." : success}
      </p>
    </section>
  );
}
