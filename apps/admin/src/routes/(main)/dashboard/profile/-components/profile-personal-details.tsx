import { LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import type { ProfileRecord } from "./profile-data";
import { ProfileField } from "./profile-field";

export function PersonalDetails({ profile }: { profile: ProfileRecord }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-base font-medium">Personal information</h2>
          <Badge className="rounded-sm" variant="outline">
            <LockKeyhole data-icon="inline-start" />
            Private
          </Badge>
        </div>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Preferred name">{profile.preferredName}</ProfileField>
            <ProfileField label="Date of birth">{profile.dateOfBirth}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Legal name">{profile.legalName}</ProfileField>
            <ProfileField label="Personal email">{profile.personalEmail}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Pronouns">{profile.pronouns}</ProfileField>
            <ProfileField label="Work phone">{profile.workPhone}</ProfileField>
          </div>
        </dl>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-base font-medium">Address and emergency contact</h2>
          <Badge className="rounded-sm" variant="outline">
            <LockKeyhole data-icon="inline-start" />
            Private
          </Badge>
        </div>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Home address">{profile.address}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Emergency contact">{profile.emergencyContact}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Emergency phone">{profile.emergencyPhone}</ProfileField>
          </div>
        </dl>
      </div>
    </>
  );
}
