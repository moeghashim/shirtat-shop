import { useEffect, useRef, useState } from "react";

import { Link, useRouter, useRouterState } from "@tanstack/react-router";

import { cn } from "cn";
import { ChevronRight, FolderOpen, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  type NavigationProject,
  type ProjectNavigationData,
  projectDestination,
  projectLocation,
  projectViews,
} from "@/navigation/project-destinations";

import type { useProjectExpansion } from "./project-expansion";

function ViewLinks({
  project,
  pathname,
  popover = false,
}: {
  project: NavigationProject;
  pathname: string;
  popover?: boolean;
}) {
  const active = projectLocation(pathname);
  return (
    <SidebarMenuSub className={popover ? "m-0 border-0 p-0" : ""}>
      {projectViews.map((view) => (
        <SidebarMenuSubItem key={view.id}>
          <SidebarMenuSubButton
            render={<Link {...projectDestination(project.id, view.id)} />}
            isActive={active?.projectId === project.id && active.view === view.id}
            aria-current={active?.projectId === project.id && active.view === view.id ? "page" : undefined}
          >
            <view.icon aria-hidden="true" />
            <span>{view.label}</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}
function ProjectItem({
  project,
  pathname,
  open,
  toggle,
}: {
  project: NavigationProject;
  pathname: string;
  open: boolean;
  toggle: (open: boolean) => void;
}) {
  const router = useRouter();
  const { state, isMobile } = useSidebar(),
    [flyout, setFlyout] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const active = projectLocation(pathname)?.projectId === project.id;
  const name = `${project.name} views, ${project.status.replaceAll("-", " ")}${project.favorite ? ", starred" : ""}`;
  useEffect(() => router.subscribe("onResolved", () => setFlyout(false)), [router]);
  if (state === "collapsed" && !isMobile)
    return (
      <SidebarMenuItem>
        <Popover open={flyout} onOpenChange={setFlyout}>
          <PopoverTrigger render={<SidebarMenuButton tooltip={project.name} isActive={active} />} aria-label={name}>
            <FolderOpen aria-hidden="true" />
            <span>{project.name}</span>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" sideOffset={12} aria-label={`${project.name} project views`}>
            <PopoverTitle className="px-2 py-1 break-words">{project.name}</PopoverTitle>
            <ViewLinks project={project} pathname={pathname} popover />
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    );
  return (
    <Collapsible
      render={<li />}
      open={open}
      onOpenChange={(next) => {
        if (!next && panel.current?.contains(document.activeElement)) trigger.current?.focus();
        toggle(next);
      }}
    >
      <CollapsibleTrigger ref={trigger} render={<SidebarMenuButton isActive={active} />} aria-label={name}>
        <FolderOpen aria-hidden="true" />
        <span className="truncate" title={project.name}>
          {project.name}
        </span>
        {project.favorite && <Star className="text-warning size-3 fill-current" aria-hidden="true" />}
        <ChevronRight className={cn("ml-auto size-3.5 transition-transform", open && "rotate-90")} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent ref={panel}>
        <ViewLinks project={project} pathname={pathname} />
      </CollapsibleContent>
    </Collapsible>
  );
}
export function ProjectNavigation({
  data,
  expansion,
}: {
  data: ProjectNavigationData;
  expansion: ReturnType<typeof useProjectExpansion>;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname }),
    router = useRouter();
  const { expanded, toggle } = expansion;
  return (
    <SidebarGroup className="p-0 pb-3" aria-label="Projects navigation">
      <SidebarGroupLabel className="px-3">Projects</SidebarGroupLabel>
      {data.error && (
        <div className="space-y-2 px-3 py-2">
          <p className="text-muted-foreground text-xs">Projects could not be loaded.</p>
          <Button variant="outline" size="sm" onClick={() => void router.invalidate()}>
            Retry projects
          </Button>
        </div>
      )}
      {!data.error && data.projects.length > 0 && (
        <SidebarMenu>
          {data.projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              pathname={pathname}
              open={expanded.includes(project.id)}
              toggle={(open) => toggle(project.id, open)}
            />
          ))}
        </SidebarMenu>
      )}
      {!data.error && data.projects.length === 0 && (
        <p className="text-muted-foreground px-3 py-2 text-xs group-data-[collapsible=icon]:hidden">No projects yet.</p>
      )}
    </SidebarGroup>
  );
}
