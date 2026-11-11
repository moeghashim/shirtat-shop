import { useRef, useState } from "react";

import { useRouter } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent } from "@/components/ui/field";
import { checkedByLine, ownerName, type SeoChecklistLocale, seoText, statusName } from "@/server/seo/copy";
import type { SeoChecklistTask, SeoDashboardData } from "@/server/seo/read.server";

import { toggleSeoTask } from "./toggle-task";

interface Override {
  checked: boolean;
  completion: string | null;
  status: SeoChecklistTask["status"];
}

function groupsOf(tasks: readonly SeoChecklistTask[]) {
  const phases: { areas: { area: string; tasks: SeoChecklistTask[] }[]; phase: string }[] = [];
  for (const task of tasks) {
    let phase = phases.find((item) => item.phase === task.phase);
    if (!phase) {
      phase = { areas: [], phase: task.phase };
      phases.push(phase);
    }
    let area = phase.areas.find((item) => item.area === task.area);
    if (!area) {
      area = { area: task.area, tasks: [] };
      phase.areas.push(area);
    }
    area.tasks.push(task);
  }
  return phases;
}

function optimisticStatus(done: boolean, status: SeoChecklistTask["status"]): SeoChecklistTask["status"] {
  if (done) return "done";
  if (status === "done") return "not-started";
  return status;
}

function viewOf(task: SeoChecklistTask, override: Override | undefined) {
  return {
    checked: override?.checked ?? task.checked,
    completion: override?.completion ?? task.completion,
    status: override?.status ?? task.status,
  };
}

export function SeoChecklist({ tasks }: { tasks: SeoDashboardData["tasks"] }) {
  const router = useRouter();
  const locale: SeoChecklistLocale = tasks.locale;
  const serverKey = tasks.tasks
    .map((task) => `${task.id}:${task.checked}:${task.status}:${task.completion ?? ""}`)
    .join("\n");
  const [seen, setSeen] = useState(serverKey);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [busy, setBusy] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);
  const requestIds = useRef<Record<string, number>>({});
  if (seen !== serverKey) {
    setSeen(serverKey);
    setOverrides({});
  }
  const activeOverrides = seen === serverKey ? overrides : {};
  const groups = groupsOf(tasks.tasks);

  function failureCopy(reason: "forbidden" | "unavailable" | "unknown-task") {
    if (reason === "forbidden") return seoText("forbidden", locale);
    if (reason === "unknown-task") return seoText("unknownTask", locale);
    return seoText("unavailable", locale);
  }

  function onToggle(task: SeoChecklistTask, done: boolean) {
    if (!tasks.canToggle || busy[task.id]) return;
    const previous = activeOverrides[task.id] ?? {
      checked: task.checked,
      completion: task.completion,
      status: task.status,
    };
    const requestId = (requestIds.current[task.id] ?? 0) + 1;
    requestIds.current[task.id] = requestId;
    setError(null);
    setBusy((current) => ({ ...current, [task.id]: true }));
    setOverrides((current) => ({
      ...current,
      [task.id]: {
        checked: done,
        completion: done ? checkedByLine(locale, tasks.actorName, tasks.todayLabel) : null,
        status: optimisticStatus(done, task.status),
      },
    }));
    void toggleSeoTask({ data: { done, taskId: task.id } })
      .then((result) => {
        if (requestIds.current[task.id] !== requestId) return;
        if (!result.ok) {
          setOverrides((current) => ({ ...current, [task.id]: previous }));
          setError(failureCopy(result.reason));
          return;
        }
        setOverrides((current) => ({
          ...current,
          [task.id]: { checked: result.done, completion: result.completion, status: result.status },
        }));
        void router.invalidate();
      })
      .catch(() => {
        if (requestIds.current[task.id] !== requestId) return;
        setOverrides((current) => ({ ...current, [task.id]: previous }));
        setError(seoText("saveFailed", locale));
      })
      .finally(() => {
        if (requestIds.current[task.id] !== requestId) return;
        setBusy((current) => {
          const next = { ...current };
          delete next[task.id];
          return next;
        });
      });
  }

  return (
    <div className="grid gap-4" id="seo-checklist">
      {tasks.notice ? (
        <p className="text-muted-foreground text-sm" role="status">
          {tasks.notice}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {groups.length === 0 ? <p className="text-sm">{seoText("emptyTasks", locale)}</p> : null}
      {groups.map((phase, phaseIndex) => (
        <section aria-labelledby={`seo-phase-${phaseIndex}`} className="grid gap-4" key={phase.phase}>
          <h2 className="text-sm font-medium" id={`seo-phase-${phaseIndex}`}>
            {phase.phase}
          </h2>
          {phase.areas.map((area) => (
            <div className="grid gap-2" key={area.area}>
              <h3 className="text-muted-foreground text-sm">{area.area}</h3>
              <ul className="grid gap-2">
                {area.tasks.map((task) => {
                  const view = viewOf(task, activeOverrides[task.id]);
                  return (
                    <li key={task.id}>
                      <Field data-done={view.checked ? "true" : "false"} orientation="horizontal">
                        <Checkbox
                          checked={view.checked}
                          disabled={!tasks.canToggle || Boolean(busy[task.id])}
                          id={`seo-task-${task.id}`}
                          onCheckedChange={(checked) => onToggle(task, checked === true)}
                        />
                        <FieldContent className="gap-1">
                          <label
                            className="data-[done=true]:text-muted-foreground text-sm font-medium data-[done=true]:line-through"
                            data-done={view.checked ? "true" : "false"}
                            dir="auto"
                            htmlFor={`seo-task-${task.id}`}
                          >
                            {task.action}
                          </label>
                          <p className="text-muted-foreground text-sm">
                            <span>{statusName(view.status, locale)}</span>
                            <span> · </span>
                            <span>{ownerName(task.owner, locale)}</span>
                            <span> · </span>
                            <span>{task.phase}</span>
                            {task.approvalNeeded ? (
                              <>
                                <span> · </span>
                                <Badge variant="outline">{seoText("needsApproval", locale)}</Badge>
                              </>
                            ) : null}
                          </p>
                          {view.completion ? (
                            <p className="text-muted-foreground text-sm" dir="auto">
                              {view.completion}
                            </p>
                          ) : null}
                          <p className="text-sm" dir="auto">
                            {task.measure}
                          </p>
                          {task.evidence ? (
                            <p className="text-muted-foreground text-sm" dir="auto">
                              {task.evidence}
                            </p>
                          ) : null}
                          {task.link ? (
                            <a className="w-fit text-sm underline underline-offset-4" href={task.link} rel="noreferrer">
                              {seoText("openLink", locale)}
                            </a>
                          ) : null}
                        </FieldContent>
                      </Field>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
