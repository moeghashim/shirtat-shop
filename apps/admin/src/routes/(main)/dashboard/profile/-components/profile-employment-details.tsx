import { Separator } from "@/components/ui/separator";

import type { ProfileRecord } from "./profile-data";
import { ProfileField } from "./profile-field";

export function EmploymentDetails({ profile }: { profile: ProfileRecord }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">Role and organization</h2>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Job title">{profile.jobTitle}</ProfileField>
            <ProfileField label="Team">{profile.team}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Job level">{profile.jobLevel}</ProfileField>
            <ProfileField label="Manager">{profile.manager.name}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Department">{profile.department}</ProfileField>
            <ProfileField label="Current project">{profile.currentProject}</ProfileField>
          </div>
        </dl>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">Contract details</h2>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Contractor ID">{profile.contractorId}</ProfileField>
            <ProfileField label="Engagement status">{profile.engagementStatus}</ProfileField>
            <ProfileField label="Employment type">{profile.employmentType}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Contracting entity">{profile.contractingEntity}</ProfileField>
            <ProfileField label="Start date">{profile.startDate}</ProfileField>
            <ProfileField label="Last working day">{profile.lastWorkingDay}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Notice period">{profile.noticePeriod}</ProfileField>
          </div>
        </dl>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">Work arrangement</h2>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Workplace">{profile.workplace}</ProfileField>
            <ProfileField label="Time zone">{profile.timeZone}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Weekly hours">{profile.weeklyHours}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Schedule">{profile.schedule}</ProfileField>
          </div>
        </dl>
      </div>
    </>
  );
}
