import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import registry from "../../../../../../registry.json";

/** Share the registry inventory; compute host-specific commands only after hydration. */
export function RegistryInstall({ section }: { section: string }) {
  const [origin, setOrigin] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <div className="min-w-0 space-y-2">
      <details>
        <summary className="min-h-6 w-fit cursor-pointer rounded-sm text-sm underline underline-offset-4">
          Install{" "}
          {section === "cards" || section === "charts"
            ? `${section} in another project`
            : registry.items.find((item) => item.meta.kitSection === section)?.title}
        </summary>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm">
          Requires React 19, Tailwind v4 and initialized shadcn. Includes the default tenboards theme, typography and
          compact spacing; review the global CSS changes. Related blocks share their source module.
        </p>
        <ul className="mt-3 space-y-4">
          {registry.items
            .filter((item) => item.meta.kitSection === section)
            .map((item) => {
              const url = `/r/${item.name}.json`;
              const command = `npx shadcn add ${origin || "<this-origin>"}${url}`;
              return (
                <li key={item.name} className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={url}
                      className="text-primary inline-flex min-h-6 items-center rounded-sm text-sm underline underline-offset-4"
                    >
                      {item.title} registry JSON
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!origin}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(command);
                          setStatus(`${item.title} install command copied.`);
                        } catch {
                          setStatus("Copy unavailable. Select and copy the command below.");
                        }
                      }}
                    >
                      Copy {item.title} command
                    </Button>
                  </div>
                  <code className="bg-muted block rounded-md p-3 text-xs break-all">{command}</code>
                </li>
              );
            })}
        </ul>
      </details>
      <p role="status" className="text-muted-foreground text-xs">
        {status}
      </p>
    </div>
  );
}
