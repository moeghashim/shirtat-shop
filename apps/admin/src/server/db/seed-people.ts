import type { getDatabase } from "./client.server.ts";
import { accounts } from "./fixtures/accounts.ts";
import { profile } from "./fixtures/profile.ts";
import {
  demoAccounts,
  profileContacts,
  profileDocuments,
  profileEmployment,
  profileLeave,
  profilePeople,
  profiles,
} from "./people-schema.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];
export async function seedPeople(tx: Transaction) {
  for (const [position, account] of accounts.entries()) {
    await tx
      .insert(demoAccounts)
      .values({ ...account, position })
      .onConflictDoUpdate({ target: demoAccounts.id, set: { ...account, position } });
  }
  const person = { id: "profile-manager-alex", ...profile.manager };
  await tx.insert(profilePeople).values(person).onConflictDoUpdate({ target: profilePeople.id, set: person });
  {
    const row = {
      contractorId: profile.contractorId,
      name: profile.name,
      preferredName: profile.preferredName,
      legalName: profile.legalName,
      pronouns: profile.pronouns,
      initials: profile.initials,
      avatar: profile.avatar,
      engagementStatus: profile.engagementStatus,
      dateOfBirth: profile.dateOfBirth,
      bio: profile.bio,
      updatedBy: profile.updatedBy,
      updatedAt: profile.updatedAt,
      managerId: person.id,
      completionPercent: profile.completionPercent,
      verified: profile.verified,
      recordStatus: profile.recordStatus,
      recordDescription: profile.recordDescription,
    };
    await tx.insert(profiles).values(row).onConflictDoUpdate({ target: profiles.contractorId, set: row });
  }
  {
    const row = {
      contractorId: profile.contractorId,
      workEmail: profile.workEmail,
      personalEmail: profile.personalEmail,
      workPhone: profile.workPhone,
      address: profile.address,
      emergencyContact: profile.emergencyContact,
      emergencyPhone: profile.emergencyPhone,
    };
    await tx.insert(profileContacts).values(row).onConflictDoUpdate({ target: profileContacts.contractorId, set: row });
  }
  {
    const row = {
      contractorId: profile.contractorId,
      jobTitle: profile.jobTitle,
      jobLevel: profile.jobLevel,
      department: profile.department,
      team: profile.team,
      currentProject: profile.currentProject,
      workplace: profile.workplace,
      timeZone: profile.timeZone,
      startDate: profile.startDate,
      engagementLength: profile.engagementLength,
      employmentType: profile.employmentType,
      weeklyHours: profile.weeklyHours,
      schedule: profile.schedule,
      contractingEntity: profile.contractingEntity,
      noticePeriod: profile.noticePeriod,
    };
    await tx
      .insert(profileEmployment)
      .values(row)
      .onConflictDoUpdate({ target: profileEmployment.contractorId, set: row });
  }
  {
    const row = {
      contractorId: profile.contractorId,
      leavePolicy: profile.leavePolicy,
      annualLeaveAllowance: profile.annualLeaveAllowance,
      remainingLeave: profile.remainingLeave,
      carriedOverLeave: profile.carriedOverLeave,
      usedLeave: profile.usedLeave,
      scheduledLeave: profile.scheduledLeave,
      pendingLeaveRequests: profile.pendingLeaveRequests,
      leaveYear: profile.leaveYear,
      nextLeave: profile.nextLeave,
      lastWorkingDay: profile.lastWorkingDay,
    };
    await tx.insert(profileLeave).values(row).onConflictDoUpdate({ target: profileLeave.contractorId, set: row });
  }
  for (const [position, document] of profile.documents.entries()) {
    const row = { ...document, position, contractorId: profile.contractorId };
    await tx.insert(profileDocuments).values(row).onConflictDoUpdate({ target: profileDocuments.id, set: row });
  }
}
