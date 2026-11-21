export const GA_MEASUREMENT_ID = "G-6DT5S4QRGT";
export const GA_CLIENT_ATTRIBUTE = "_ga_cid";
export const GA_SESSION_ATTRIBUTE = "_ga_sid";

export interface GaCheckoutIds {
  clientId: string | null;
  sessionId: string | null;
}

export function gaSessionCookieName(measurementId = GA_MEASUREMENT_ID): string {
  return `_ga_${measurementId.replace(/^G-/, "")}`;
}

export function readGaCheckoutIds(cookieHeader: string | null | undefined): GaCheckoutIds {
  return {
    clientId: gaClientId(readCookie(cookieHeader, "_ga")),
    sessionId: gaSessionId(readCookie(cookieHeader, gaSessionCookieName())),
  };
}

// `_ga` is `GA1.<domain>.<random>.<timestamp>`. Measurement Protocol wants `<random>.<timestamp>`.
export function gaClientId(value: string | null | undefined): string | null {
  const decoded = decodeCookieValue(value);
  if (!decoded) return null;
  const stripped = decoded.replace(/^GA1\.\d+\./, "");
  return /^\d+\.\d+$/.test(stripped) ? stripped : null;
}

// GS1 is positional (`GS1.1.<sessionId>.…`). GS2 names fields (`s<sessionId>$o…`) in any order.
export function gaSessionId(value: string | null | undefined): string | null {
  const decoded = decodeCookieValue(value);
  if (!decoded) return null;
  if (/^\d{1,20}$/.test(decoded)) return decoded;
  if (decoded.startsWith("GS2.")) {
    const body = decoded.split(".").slice(2).join(".");
    for (const part of body.split("$")) {
      if (part.startsWith("s") && /^\d{1,20}$/.test(part.slice(1))) return part.slice(1);
    }
    return null;
  }
  if (decoded.startsWith("GS1.")) {
    const session = decoded.split(".")[2] ?? "";
    return /^\d{1,20}$/.test(session) ? session : null;
  }
  return null;
}

export function withGaCheckoutAttributes(
  attributes: ReadonlyArray<{ key: string; value?: string | null }>,
  ids: GaCheckoutIds,
): Array<{ key: string; value: string }> {
  const next: Array<{ key: string; value: string }> = [];
  for (const attribute of attributes) {
    if (!attribute.key || isGaCheckoutKey(attribute.key) || attribute.value == null) continue;
    next.push({ key: attribute.key, value: attribute.value });
  }
  const clientId = ids.clientId ?? storedAttribute(attributes, GA_CLIENT_ATTRIBUTE);
  const sessionId = ids.sessionId ?? storedAttribute(attributes, GA_SESSION_ATTRIBUTE);
  if (clientId) next.push({ key: GA_CLIENT_ATTRIBUTE, value: clientId });
  if (sessionId) next.push({ key: GA_SESSION_ATTRIBUTE, value: sessionId });
  return next;
}

export function checkoutUrlWithGaAttributes(url: string, ids: GaCheckoutIds): string {
  if (!ids.clientId && !ids.sessionId) return url;
  const absolute = /^[a-z][a-z\d+\-.]*:/i.test(url);
  let parsed: URL;
  try {
    parsed = new URL(url, "https://shirtat.co");
  } catch {
    return url;
  }
  if (ids.clientId) parsed.searchParams.set(`attributes[${GA_CLIENT_ATTRIBUTE}]`, ids.clientId);
  if (ids.sessionId) parsed.searchParams.set(`attributes[${GA_SESSION_ATTRIBUTE}]`, ids.sessionId);
  if (absolute) return parsed.toString();
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function storedAttribute(
  attributes: ReadonlyArray<{ key: string; value?: string | null }>,
  key: string,
): string | null {
  for (const attribute of attributes) {
    if (attribute.key?.toLowerCase() !== key) continue;
    return typeof attribute.value === "string" && attribute.value ? attribute.value : null;
  }
  return null;
}

function isGaCheckoutKey(key: string): boolean {
  const name = key.toLowerCase();
  return name === GA_CLIENT_ATTRIBUTE || name === GA_SESSION_ATTRIBUTE;
}

function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value || null;
  }
  return null;
}

function decodeCookieValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}
