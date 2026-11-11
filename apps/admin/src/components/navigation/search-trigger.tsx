import { cn } from "cn";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SearchTrigger({ sidebar = false, compact = false }: { sidebar?: boolean; compact?: boolean }) {
  return (
    <Button
      aria-label="Search ⌘K — pages (Command or Control K)"
      onClick={(event) => document.dispatchEvent(new CustomEvent("tenboards:search", { detail: event.currentTarget }))}
      variant="ghost"
      size={compact ? "icon" : "default"}
      className={
        sidebar
          ? "shell-search text-muted-foreground w-full justify-start gap-2 rounded-full border"
          : "text-muted-foreground font-normal"
      }
    >
      <Search aria-hidden="true" />
      <span className={cn(compact && "sr-only", sidebar && "group-data-[collapsible=icon]:hidden")}>Search</span>
      <kbd hidden={compact} className="bg-muted ml-auto rounded-md px-1.5 text-xs group-data-[collapsible=icon]:hidden">
        ⌘K
      </kbd>
    </Button>
  );
}
