import type { AssistantConfig, ProviderId, ProviderInfo } from "../../lib/assistant/config.ts";
import { type AuthEnvironment, authConfiguration } from "../../lib/auth/config.ts";
import { AssistantError } from "./errors.ts";

export const providers = [
  {
    id: "anthropic",
    name: "Anthropic",
    key: "ANTHROPIC_API_KEY",
    override: "ANTHROPIC_MODEL",
    model: "claude-sonnet-5-5",
  },
  { id: "openai", name: "OpenAI", key: "OPENAI_API_KEY", override: "OPENAI_MODEL", model: "gpt-6.1-sol" },
  { id: "xai", name: "xAI", key: "XAI_API_KEY", override: "XAI_MODEL", model: "grok-4.7" },
  { id: "meta", name: "Meta", key: "META_API_KEY", override: "META_MODEL", model: "muse-spark-1.3" },
  {
    id: "google",
    name: "Google",
    key: "GOOGLE_GENERATIVE_AI_API_KEY",
    override: "GOOGLE_GENERATIVE_AI_MODEL",
    model: "gemini-3.8-flash",
  },
] as const;
export type AssistantEnvironment = Partial<
  Record<(typeof providers)[number]["key" | "override"] | "ASSISTANT_ORIGIN", string>
>;
export type RuntimeEnvironment = AuthEnvironment & AssistantEnvironment;
export type ConfiguredProvider = ProviderInfo & { key: string };
export function assistantConfiguration(env: AssistantEnvironment): ConfiguredProvider[] {
  const result: ConfiguredProvider[] = [];
  for (const entry of providers) {
    const model = env[entry.override] ?? entry.model;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model)) throw new AssistantError("configuration");
    const key = env[entry.key]?.trim();
    if (!key) continue;
    if (key.length > 8192 || !/^[\x21-\x7e]+$/.test(key)) throw new AssistantError("configuration");
    result.push({ id: entry.id, name: entry.name, model, key });
  }
  return result;
}
export function publicConfiguration(config: ConfiguredProvider[]): AssistantConfig {
  return { providers: config.map(({ id, name, model }) => ({ id, name, model })) };
}
export function selectProvider(config: ConfiguredProvider[], id?: ProviderId): ConfiguredProvider | undefined {
  if (!config.length && id === undefined) return undefined;
  const provider = config.find((item) => item.id === id);
  if (!provider) throw new AssistantError("invalid", 400);
  return provider;
}
function origin(value: string) {
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && loopback(url)))
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new AssistantError("configuration");
  }
}
const loopback = (url: URL) => ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
export function canonicalOrigin(env: RuntimeEnvironment, requestURL: string, live: boolean) {
  const auth = authConfiguration(env);
  const explicit = env.ASSISTANT_ORIGIN?.trim() ? origin(env.ASSISTANT_ORIGIN.trim()) : undefined;
  if (auth.enabled) {
    if (explicit && explicit !== auth.baseURL) throw new AssistantError("configuration");
    return auth.baseURL;
  }
  if (explicit) return explicit;
  const request = new URL(requestURL);
  if (live && !loopback(request)) throw new AssistantError("configuration");
  return request.origin;
}
