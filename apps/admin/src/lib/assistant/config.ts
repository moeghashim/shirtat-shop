export const providerIds = ["anthropic", "openai", "xai", "meta", "google"] as const;
export type ProviderId = (typeof providerIds)[number];
export type ProviderInfo = { id: ProviderId; name: string; model: string };
export type AssistantConfig = { providers: ProviderInfo[] };
