import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { cn } from "cn";
import { Check, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export function AccountSwitcher({
  users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
}) {
  const [activeId, setActiveId] = useState(users[0]?.id);
  const activeUser = users.find((user) => user.id === activeId) ?? users[0];

  if (!activeUser) {
    return null;
  }

  const initials = getInitials(activeUser.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={`${initials} — Demo account: ${activeUser.name}`} />}
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="px-2 py-2">
          <p className="font-medium">Demo accounts</p>
          <p className="text-muted-foreground text-xs">Switch sample identity. No sign-in required.</p>
        </div>
        {users.map((user) => (
          <DropdownMenuItem
            key={user.email}
            className={cn("p-0", user.id === activeUser.id && "bg-accent/50")}
            aria-current={user.id === activeUser.id ? "true" : undefined}
            onClick={() => setActiveId(user.id)}
          >
            <div className="flex w-full items-center gap-2 px-1 py-1.5">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs capitalize">{user.email}</span>
              </div>
              <span
                className={cn(
                  "text-primary mr-1 flex size-5 items-center justify-center rounded-full opacity-0",
                  user.id === activeUser.id && "opacity-100",
                )}
              >
                <Check aria-hidden="true" />
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/dashboard/profile" />}>
            <UserRound />
            View demo profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
