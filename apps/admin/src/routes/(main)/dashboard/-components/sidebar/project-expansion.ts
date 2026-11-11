import { useEffect, useRef, useState } from "react";

import { projectLocation } from "@/navigation/project-destinations";
export const projectExpansionKey = "tenboards:project-nav:v1";
export function restoreProjectExpansion(raw: string | null, known: readonly string[]) {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    return Object.entries(value)
      .filter(([id, expanded]) => expanded === true && known.includes(id))
      .slice(0, 50)
      .map(([id]) => id);
  } catch {
    return [];
  }
}
export function useProjectExpansion(ids: readonly string[], pathname: string) {
  const active = projectLocation(pathname)?.projectId;
  const [expanded, setExpanded] = useState<string[]>(() => (active && ids.includes(active) ? [active] : []));
  const [restored, setRestored] = useState(false);
  const previousActive = useRef(active);
  const currentActive = useRef(active);
  currentActive.current = active;
  const idsKey = JSON.stringify(ids);
  useEffect(() => {
    const known: string[] = JSON.parse(idsKey);
    const active = currentActive.current;
    let saved: string[] = [];
    try {
      saved = restoreProjectExpansion(localStorage.getItem(projectExpansionKey), known);
    } catch {
      /* Storage can be disabled; keep the in-memory state. */
    }
    setExpanded([...new Set([...saved, ...(active && known.includes(active) ? [active] : [])])].slice(-50));
    setRestored(true);
  }, [idsKey]);
  useEffect(() => {
    if (active !== previousActive.current && active && (JSON.parse(idsKey) as string[]).includes(active))
      setExpanded((before) => [...new Set([...before, active])].slice(-50));
    previousActive.current = active;
  }, [active, idsKey]);
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(projectExpansionKey, JSON.stringify(Object.fromEntries(expanded.map((id) => [id, true]))));
    } catch {
      /* Storage can be disabled; keep the in-memory state. */
    }
  }, [expanded, restored]);
  return {
    expanded,
    toggle: (id: string, open: boolean) =>
      setExpanded((before) =>
        open ? [...new Set([...before, id])].slice(-50) : before.filter((value) => value !== id),
      ),
  };
}
