let cached: { expiresAt: number; value: string } | null = null;

/** Short-lived read access for order lookups, minted with the site's own Admin app credentials. */
export async function getAdminToken(domain: string): Promise<string | null> {
  if (cached && Date.now() < cached.expiresAt) return cached.value;
  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  cached = {
    expiresAt: Date.now() + Math.max((json.expires_in ?? 3600) - 300, 60) * 1000,
    value: json.access_token,
  };
  return json.access_token;
}
