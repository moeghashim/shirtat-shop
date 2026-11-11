import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { LogOut, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authError, signOut } from "@/lib/auth/client";
import type { AuthState } from "@/lib/auth/types";
import { getInitials } from "@/lib/utils";

export function SignedInAccount({ user }: { user: NonNullable<AuthState["user"]> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Signed in as ${user.name}`} />}>
        <Avatar className="size-8">
          <AvatarFallback>{getInitials(user.name).slice(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 max-w-[calc(100vw-2rem)] space-y-1 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <div className="space-y-1 px-2 py-2">
          <p className="font-medium wrap-anywhere">{user.name}</p>
          <p className="text-muted-foreground text-xs wrap-anywhere">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/dashboard/profile" search={{ tab: "account" }} />}>
            <UserRound />
            Account &amp; security
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            closeOnClick={false}
            onClick={async () => {
              if (pending) return;
              setPending(true);
              setError("");
              try {
                await signOut();
              } catch {
                setError(authError());
                setPending(false);
              }
            }}
          >
            <LogOut />
            {pending ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {error && (
          <p role="alert" className="text-destructive px-2 py-2 text-sm">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
