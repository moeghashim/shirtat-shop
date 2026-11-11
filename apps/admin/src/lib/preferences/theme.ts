const THEME_MODE_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((o) => o.value);
export type ThemeMode = (typeof THEME_MODE_VALUES)[number];
export type ResolvedThemeMode = "light" | "dark";

// --- generated:themePresets:start ---

export const THEME_PRESET_OPTIONS = [
  {
    label: "Default",
    value: "default",
    primary: {
      light: "#1e40af",
      dark: "#a9c2ff",
    },
  },
  {
    label: "Graphite",
    value: "graphite",
    primary: {
      light: "#303948",
      dark: "#d1d8e4",
    },
  },
  {
    label: "Iris",
    value: "iris",
    primary: {
      light: "#5b21b6",
      dark: "#c4b5fd",
    },
  },
  {
    label: "Pine",
    value: "pine",
    primary: {
      light: "#115e59",
      dark: "#5eead4",
    },
  },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];

// --- generated:themePresets:end ---
