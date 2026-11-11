import type { LucideIcon } from "lucide-react";

export type NavigationProject = { favorite: boolean; id: string; name: string; status: string };
export type ProjectNavigationData = { error: boolean; projects: NavigationProject[] };
export type ProjectView = string;
export const projectViews: readonly { icon: LucideIcon; id: ProjectView; label: string }[] = [];

export function projectDestination(projectId: string, view: ProjectView) {
  void projectPath(projectId, view);
  return { to: "/dashboard/seo" as const };
}

export function projectLocation(path: string): { projectId: string; view?: ProjectView } | null {
  if (path.length === 0) return { projectId: path };
  return null;
}

export function projectPath(projectId: string, view: ProjectView) {
  return `/dashboard/projects/${encodeURIComponent(projectId)}/${encodeURIComponent(view)}`;
}
