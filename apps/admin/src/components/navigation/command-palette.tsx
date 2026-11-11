import { useCallback, useEffect, useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { File } from "lucide-react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { routeCatalog } from "@/navigation/route-catalog";
import type { AppPath } from "@/navigation/sidebar/sidebar-items";

const aliasRoutes = new Set(["/", "/dashboard", "/dashboard/", "/auth/v2"]);
const searchRoutes = routeCatalog.filter((item) => !aliasRoutes.has(item.route));
const groups = ["Dashboards", "Pages", "Developer", "Other screens", "Misc"];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const show = (event?: Event) => {
      returnFocus.current =
        event instanceof CustomEvent && event.detail instanceof HTMLElement
          ? event.detail
          : (document.activeElement as HTMLElement);
      setQuery("");
      setOpen(true);
    };
    const down = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== "k" ||
        !(event.metaKey || event.ctrlKey)
      )
        return;
      // Respect another dialog's interaction and any open menu/select popup.
      const blocking = [
        ...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]'),
      ].some((node) => {
        const element = node as HTMLElement;
        return (
          element.getClientRects().length > 0 &&
          !element.closest("[data-command-palette]") &&
          !element.matches('[data-mobile="true"]')
        );
      });
      if (blocking && !open) return;
      event.preventDefault();
      if (open) setOpen(false);
      else show();
    };
    document.addEventListener("keydown", down);
    document.addEventListener("tenboards:search", show);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("tenboards:search", show);
    };
  }, [open]);

  const connectInput = useCallback((field: HTMLInputElement | null) => {
    input.current = field;
    const command = field?.closest("[cmdk-root]");
    if (!field || !command) return;
    // cmdk can omit the active descendant when filtering leaves one already-selected
    // item. Keep the combobox's accessible target aligned with the rendered selection.
    const syncSelection = () => {
      const selected = command.querySelector('[cmdk-item][aria-selected="true"]');
      const id = selected?.id;
      if (id && field.getAttribute("aria-activedescendant") !== id) field.setAttribute("aria-activedescendant", id);
      else if (!id && field.hasAttribute("aria-activedescendant")) field.removeAttribute("aria-activedescendant");
    };
    const observer = new MutationObserver(syncSelection);
    observer.observe(command, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-selected", "aria-activedescendant"],
    });
    syncSelection();
    return () => {
      observer.disconnect();
      input.current = null;
    };
  }, []);

  const select = (item: (typeof routeCatalog)[number]) => {
    setOpen(false);
    setQuery("");
    void navigate({ to: item.route as AppPath });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setQuery("");
      }}
    >
      <DialogContent
        data-command-palette
        className="top-[12dvh] max-h-[76dvh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
        initialFocus={input}
        finalFocus={() => (returnFocus.current?.isConnected ? returnFocus.current : false)}
        showCloseButton
      >
        <DialogHeader className="border-b px-4 py-3 pr-12">
          <DialogTitle className="text-sm">Go to a page</DialogTitle>
          <DialogDescription>Search dashboards, apps, and demo screens.</DialogDescription>
        </DialogHeader>
        <Command
          label="Search pages"
          className="[&_[data-slot=input-group]:focus-within]:outline-ring min-h-0 rounded-none! p-2 [&_[data-slot=input-group]:focus-within]:[outline:2px_solid_var(--ring)] [&_[data-slot=input-group]:focus-within]:outline-offset-2"
        >
          <CommandInput
            ref={connectInput}
            className="focus-visible:outline-none!"
            aria-label="Search pages"
            placeholder="Search pages…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[50dvh]">
            <CommandEmpty>No pages found. Try a dashboard or app name.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group} heading={group}>
                {searchRoutes
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon ?? File;
                    return (
                      <CommandItem
                        key={item.route}
                        value={`${item.label} ${item.group} ${item.route}`}
                        onSelect={() => select(item)}
                        className="min-h-10 gap-3"
                      >
                        <Icon aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <div className="text-muted-foreground flex gap-4 border-t px-4 py-2 text-xs">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span className="ml-auto">Esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
