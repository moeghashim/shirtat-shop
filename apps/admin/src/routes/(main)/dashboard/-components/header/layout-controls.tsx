import { useId, useState } from "react";

import { RotateCcw, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { type FontKey, fontOptions } from "@/lib/fonts/registry";
import type { ContentLayout, NavbarStyle, SidebarCollapsible, SidebarVariant } from "@/lib/preferences/layout";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { THEME_PRESET_OPTIONS, type ThemeMode, type ThemePreset } from "@/lib/preferences/theme";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

const choices = {
  theme_mode: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ],
  content_layout: [
    { value: "centered", label: "Centered" },
    { value: "full-width", label: "Full width" },
  ],
  navbar_style: [
    { value: "sticky", label: "Sticky" },
    { value: "scroll", label: "Scroll with page" },
  ],
  sidebar_variant: [
    { value: "sidebar", label: "Panel" },
    { value: "inset", label: "Inset" },
    { value: "floating", label: "Floating" },
  ],
  sidebar_collapsible: [
    { value: "icon", label: "Show icons" },
    { value: "offcanvas", label: "Hide panel" },
  ],
} as const;
const defaultsSummary = [
  choices.theme_mode.find((option) => option.value === PREFERENCE_DEFAULTS.theme_mode)?.label,
  `${THEME_PRESET_OPTIONS.find((option) => option.value === PREFERENCE_DEFAULTS.theme_preset)?.label} preset`,
  fontOptions.find((option) => option.key === PREFERENCE_DEFAULTS.font)?.label,
  ...(["content_layout", "navbar_style", "sidebar_variant", "sidebar_collapsible"] as const).map(
    (key) => choices[key].find((option) => option.value === PREFERENCE_DEFAULTS[key])?.label,
  ),
].join(" · ");

type Option = { value: string; label: string };
function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="border-input has-checked:border-primary has-checked:bg-muted has-focus-visible:outline-ring relative flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LayoutControls({ sidebar = false }: { sidebar?: boolean }) {
  const { values, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((state) => ({
      values: state.values,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );
  const { setOpen } = useSidebar();
  const [resetMessage, setResetMessage] = useState("");
  const sectionId = useId();
  return (
    <Sheet onOpenChange={() => setResetMessage("")}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size={sidebar ? "default" : "icon"}
            aria-label="Layout settings"
            className={sidebar ? "px-2 group-data-[collapsible=icon]:px-0" : ""}
          />
        }
      >
        <Settings />
        {sidebar && <span className="group-data-[collapsible=icon]:hidden">Settings</span>}
      </SheetTrigger>
      <SheetContent
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        aria-label="Layout settings"
      >
        <SheetHeader className="border-b p-6 pr-12">
          <SheetTitle>Make it your workspace</SheetTitle>
          <SheetDescription>Changes apply immediately and stay in this browser.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-6">
          <section aria-labelledby={`${sectionId}-appearance`} className="space-y-5">
            <h3 id={`${sectionId}-appearance`} className="text-base font-medium">
              Appearance
            </h3>
            <ChoiceField
              label="Theme"
              value={values.theme_mode}
              options={choices.theme_mode}
              onChange={(value) => setPreference("theme_mode", value as ThemeMode)}
            />
            <SelectField
              label="Color preset"
              value={values.theme_preset}
              options={THEME_PRESET_OPTIONS}
              onChange={(value) => setPreference("theme_preset", value as ThemePreset)}
            />
            <SelectField
              label="Font"
              value={values.font}
              options={fontOptions.map((option) => ({ value: option.key, label: option.label }))}
              onChange={(value) => setPreference("font", value as FontKey)}
            />
          </section>
          <section aria-labelledby={`${sectionId}-layout`} className="space-y-5 border-t pt-6">
            <h3 id={`${sectionId}-layout`} className="text-base font-medium">
              Layout
            </h3>
            <ChoiceField
              label="Content width"
              value={values.content_layout}
              options={choices.content_layout}
              onChange={(value) => setPreference("content_layout", value as ContentLayout)}
            />
            <ChoiceField
              label="Header position"
              value={values.navbar_style}
              options={choices.navbar_style}
              onChange={(value) => setPreference("navbar_style", value as NavbarStyle)}
            />
            <ChoiceField
              label="Sidebar style"
              value={values.sidebar_variant}
              options={choices.sidebar_variant}
              onChange={(value) => setPreference("sidebar_variant", value as SidebarVariant)}
            />
            <p className="text-muted-foreground text-xs">
              Every style keeps the floating navigation panel. Inset also frames the content area.
            </p>
            <ChoiceField
              label="When collapsed"
              value={values.sidebar_collapsible}
              options={choices.sidebar_collapsible}
              onChange={(value) => setPreference("sidebar_collapsible", value as SidebarCollapsible)}
            />
            <p className="text-muted-foreground text-xs">On small screens, navigation always opens in a sheet.</p>
          </section>
        </div>
        <SheetFooter className="gap-2 border-t p-6">
          <Button
            variant="outline"
            onClick={() => {
              resetPreferences();
              setOpen(true);
              setResetMessage("tenboards defaults restored.");
            }}
          >
            <RotateCcw />
            Reset to tenboards defaults
          </Button>
          <p role="status" className="text-muted-foreground min-h-4 text-center text-xs">
            {resetMessage || `Defaults: ${defaultsSummary}`}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
