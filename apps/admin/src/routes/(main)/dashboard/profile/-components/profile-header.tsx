import { BadgeCheck, Ellipsis, Eye, Mail, Pencil, UserRoundX } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ProfileRecord } from "./profile-data";

interface ProfileHeaderProps {
  profile: ProfileRecord;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-4 md:px-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid size-18 shrink-0 place-items-center sm:size-23">
          <span className="sr-only">{`Profile ${profile.completionPercent}% complete`}</span>
          <svg aria-hidden="true" className="col-start-1 row-start-1 size-full -rotate-90" viewBox="0 0 100 100">
            <circle
              className="stroke-success fill-none"
              cx="50"
              cy="50"
              pathLength="100"
              r="46"
              strokeDasharray={`${profile.completionPercent} 100`}
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
          <Avatar className="col-start-1 row-start-1 size-16 after:border-0 sm:size-20">
            {profile.avatar && <AvatarImage alt={profile.name} src={profile.avatar} />}
            <AvatarFallback>{profile.initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading text-2xl font-medium tracking-tight [overflow-wrap:anywhere]">
              {profile.name}
            </h1>
            <p className="text-muted-foreground text-sm leading-5 [overflow-wrap:anywhere]">
              {profile.workEmail} · {profile.jobTitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-warning-surface text-warning" variant="secondary">
              {`${profile.completionPercent}% Complete`}
            </Badge>
            <Badge className="bg-success-surface text-success" variant="default">
              <BadgeCheck data-icon="inline-start" />
              {profile.verified ? "Verified" : "Unverified"}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.employmentType}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.workplace}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.timeZone}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button nativeButton={false} render={<a href={`mailto:${profile.workEmail}`} />} size="sm" variant="outline">
          <Mail data-icon="inline-start" />
          Email
        </Button>
        <Button size="sm">
          <Pencil data-icon="inline-start" />
          Edit profile
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button aria-label="More profile actions" size="icon-sm" variant="outline" />}>
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Eye />
                View as employee
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <UserRoundX />
                Deactivate profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
