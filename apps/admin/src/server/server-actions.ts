import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

import {
  getPreferencePersistence,
  PREFERENCE_REGISTRY,
  type PreferenceKey,
  type PreferenceValueMap,
  parsePreference,
} from "@/lib/preferences/preferences-config";

const getValueFromCookieServer = createServerFn({ method: "GET" })
  .validator(mailCookieKey)
  .handler(({ data: key }) => validMailLayout(getCookie(key)));

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  return getValueFromCookieServer({ data: key });
}

function mailCookieKey(key: unknown): "mail_panel_layout" {
  if (key !== "mail_panel_layout") throw new Error("Unsupported UI cookie.");
  return key;
}
function validMailLayout(value: string | undefined) {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      parsed.every((v) => typeof v === "number" && Number.isFinite(v) && v >= 10 && v <= 90) &&
      Math.abs(parsed[0] + parsed[1] - 100) < 1
    )
      return JSON.stringify(parsed);
  } catch {
    /* Invalid client UI state uses the existing default. */
  }
  return undefined;
}
function preferenceKey(key: unknown): PreferenceKey {
  if (typeof key !== "string" || !Object.hasOwn(PREFERENCE_REGISTRY, key))
    throw new Error("Unsupported UI preference.");
  return key as PreferenceKey;
}
const setValueToCookieServer = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (
      !input ||
      typeof input !== "object" ||
      !("key" in input) ||
      !("value" in input) ||
      Object.keys(input).some((key) => !["key", "value"].includes(key))
    )
      throw new Error("Invalid UI preference.");
    const key = preferenceKey(input.key);
    if (
      typeof input.value !== "string" ||
      !(PREFERENCE_REGISTRY[key].values as readonly string[]).includes(input.value)
    )
      throw new Error("Invalid UI preference.");
    return { key, value: input.value };
  })
  .handler(({ data }) => {
    setCookie(data.key, data.value, { path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
  });

export async function setValueToCookie(key: string, value: string): Promise<void> {
  await setValueToCookieServer({ data: { key, value } });
}

const getPreferenceServer = createServerFn({ method: "GET" })
  .validator(preferenceKey)
  .handler(({ data: key }) => {
    const definition = PREFERENCE_REGISTRY[key];
    const persistence = getPreferencePersistence(key);

    if (persistence !== "client-cookie" && persistence !== "server-cookie") {
      return definition.defaultValue;
    }

    return parsePreference(key, getCookie(key)?.trim());
  });

export async function getPreference<K extends PreferenceKey>(key: K): Promise<PreferenceValueMap[K]> {
  return getPreferenceServer({ data: key }) as Promise<PreferenceValueMap[K]>;
}

const getDashboardLayoutServer = createServerFn({ method: "GET" }).handler(() => ({
  defaultOpen: getCookie("sidebar_state") !== "false",
  variant: parsePreference("sidebar_variant", getCookie("sidebar_variant")?.trim()),
  collapsible: parsePreference("sidebar_collapsible", getCookie("sidebar_collapsible")?.trim()),
}));

export async function getDashboardLayout() {
  return getDashboardLayoutServer();
}
