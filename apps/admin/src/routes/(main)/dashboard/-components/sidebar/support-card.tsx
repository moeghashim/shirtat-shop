import { useEffect, useState } from "react";

import { useRouterState } from "@tanstack/react-router";

import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

const staticPaths = new Set(
  sidebarItems
    .flatMap((group) => group.items.flatMap((item) => item.subItems ?? [item]))
    .filter((item) => !item.disabled && item.url.startsWith("/dashboard/"))
    .map((item) => item.url),
);

export function SupportCard({ authenticated = false }: { authenticated?: boolean }) {
  const pathsKey = JSON.stringify([...staticPaths]);
  const demoPaths = new Set<string>(JSON.parse(pathsKey));
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if ((JSON.parse(pathsKey) as string[]).includes(path)) setVisited((previous) => new Set([...previous, path]));
  }, [path, pathsKey]);
  return (
    <div className="space-y-2 rounded-xl border p-3 group-data-[collapsible=icon]:hidden">
      <div className="text-sm">{authenticated ? "Signed in" : "Demo mode"}</div>
      <p className="text-muted-foreground text-xs">
        {visited.size} of {demoPaths.size} pages explored
      </p>
      <progress
        aria-label="Pages explored this session"
        value={visited.size}
        max={demoPaths.size}
        className="shell-demo-progress block h-1 w-full"
      />
    </div>
  );
}
