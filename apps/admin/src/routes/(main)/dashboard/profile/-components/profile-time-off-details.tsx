import { Separator } from "@/components/ui/separator";

import type { ProfileRecord } from "./profile-data";
import { ProfileField } from "./profile-field";

export function TimeOffDetails({ profile }: { profile: ProfileRecord }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">Leave balance</h2>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Policy">{profile.leavePolicy}</ProfileField>
            <ProfileField label="Carried over">{profile.carriedOverLeave}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Annual allowance">{profile.annualLeaveAllowance}</ProfileField>
            <ProfileField label="Used this year">{profile.usedLeave}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Remaining">{profile.remainingLeave}</ProfileField>
            <ProfileField label="Scheduled">{profile.scheduledLeave}</ProfileField>
          </div>
        </dl>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">Upcoming and approvals</h2>
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Next leave">{profile.nextLeave}</ProfileField>
            <ProfileField label="Pending requests">{profile.pendingLeaveRequests}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Leave year">{profile.leaveYear}</ProfileField>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <ProfileField label="Approver">{profile.manager.name}</ProfileField>
          </div>
        </dl>
      </div>
    </>
  );
}
