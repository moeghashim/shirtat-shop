import { useEffect, useRef } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { LockKeyhole } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AccountPanel } from "./-components/account-panel";
import { ProfileDocuments } from "./-components/profile-documents";
import { EmploymentDetails } from "./-components/profile-employment-details";
import { ProfileHeader } from "./-components/profile-header";
import { ProfileOverview } from "./-components/profile-overview";
import { PersonalDetails } from "./-components/profile-personal-details";
import { ProfileStatusSidebar } from "./-components/profile-status-sidebar";
import { TimeOffDetails } from "./-components/profile-time-off-details";

const loadProfile = createServerFn({ method: "GET" }).handler(async () => {
  const { requireSession } = await import("@/lib/auth/session.server");
  await requireSession();
  const { readProfile } = await import("@/server/data/profile");
  const profile = await readProfile();
  if (!profile) throw new Error("Profile data is unavailable. Check the seed and retry.");
  return profile;
});

const profileTabs = ["overview", "personal", "employment", "compensation", "time-off", "documents", "account"] as const;
type ProfileTab = (typeof profileTabs)[number];

export const Route = createFileRoute("/(main)/dashboard/profile")({
  validateSearch: (search: Record<string, unknown>): { tab?: ProfileTab } => ({
    tab: profileTabs.includes(search.tab as ProfileTab) ? (search.tab as ProfileTab) : undefined,
  }),
  loader: () => loadProfile(),
  component: Page,
});

function Page() {
  const profile = Route.useLoaderData();
  const { app } = Route.useRouteContext();
  const authenticated = app?.auth.mode === "auth";
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const tabStrip = useRef<HTMLDivElement>(null);
  const selected = tab === "account" && !authenticated ? "overview" : (tab ?? "overview");
  useEffect(() => {
    const strip = tabStrip.current;
    const active = strip?.querySelectorAll('[role="tab"]')[profileTabs.indexOf(selected)];
    if (!strip || !active) return;
    const bounds = strip.getBoundingClientRect();
    const target = active.getBoundingClientRect();
    if (target.left < bounds.left) strip.scrollLeft += target.left - bounds.left;
    else if (target.right > bounds.right) strip.scrollLeft += target.right - bounds.right;
  }, [selected]);
  return (
    <div className="flex min-w-0 flex-col gap-4 py-4" data-content-padding="false">
      <Breadcrumb className="px-4 md:px-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <span>Dashboard</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span>People</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span>Employee directory</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span>{profile.name}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {authenticated && (
        <p className="text-muted-foreground px-4 text-sm md:px-6">
          The employee record and its six tabs contain sample data. Manage your sign-in identity in Account &amp;
          security.
        </p>
      )}
      <ProfileHeader profile={profile} />

      <Tabs
        className="min-h-0 flex-1 gap-0"
        value={selected}
        onValueChange={(value) => {
          void navigate({ search: { tab: value === "overview" ? undefined : (value as ProfileTab) }, replace: true });
        }}
      >
        <div ref={tabStrip} className="touch-pan-x scrollbar-none overflow-x-auto overscroll-x-contain border-y">
          <TabsList
            className="w-max min-w-full justify-start gap-4 px-4 *:data-[slot=tabs-trigger]:flex-none"
            variant="line"
          >
            <TabsTrigger className="text-muted-foreground" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="text-muted-foreground" value="personal">
              Personal
            </TabsTrigger>
            <TabsTrigger className="text-muted-foreground" value="employment">
              Employment
            </TabsTrigger>
            <TabsTrigger className="text-muted-foreground" value="compensation">
              Compensation
            </TabsTrigger>
            <TabsTrigger className="text-muted-foreground" value="time-off">
              Time off
            </TabsTrigger>
            <TabsTrigger className="text-muted-foreground" value="documents">
              Documents
            </TabsTrigger>
            {authenticated && (
              <TabsTrigger className="text-muted-foreground" value="account">
                Account &amp; security
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="px-4 md:px-6">
          {authenticated && (
            <TabsContent className="py-6" value="account">
              <AccountPanel />
            </TabsContent>
          )}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_18rem]">
              <div className="py-4 lg:pr-6">
                <ProfileOverview profile={profile} />
              </div>
              <Separator className="hidden lg:block" orientation="vertical" />
              <div className="py-4 lg:pl-6">
                <ProfileStatusSidebar profile={profile} />
              </div>
            </div>
          </TabsContent>

          <TabsContent className="py-4" value="personal">
            <PersonalDetails profile={profile} />
          </TabsContent>

          <TabsContent className="py-4" value="employment">
            <EmploymentDetails profile={profile} />
          </TabsContent>

          <TabsContent className="py-4" value="compensation">
            <div className="bg-muted flex items-start gap-3 rounded-xl p-4">
              <LockKeyhole aria-hidden="true" className="text-muted-foreground size-4" />
              <div>
                <h2 className="text-base font-medium">Restricted information</h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Demo restricted state for people administrators and finance roles. No access control is connected.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent className="py-4" value="time-off">
            <TimeOffDetails profile={profile} />
          </TabsContent>

          <TabsContent className="py-4" value="documents">
            <ProfileDocuments documents={profile.documents} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
