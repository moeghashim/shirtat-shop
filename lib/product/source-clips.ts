import { cacheLife, cacheTag } from "next/cache";

const API_VERSION = "2025-01";

export interface SourceClip {
  id: string;
  isShort: boolean;
  /** Video host; defaults to YouTube. */
  provider?: "facebook" | "youtube";
  url: string;
}

export interface ProductSource {
  clips: SourceClip[];
  noteAr?: string;
  noteEn?: string;
}

/** Extracts a YouTube video id and whether it is a Short (vertical). */
export function parseYouTube(url: string): SourceClip | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    let isShort = false;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/);
      if (m) {
        id = m[2] ?? null;
        isShort = m[1] === "shorts";
      } else id = u.searchParams.get("v");
    }
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return { id, isShort, url };
  } catch {
    return null;
  }
}

/** Extracts a Facebook video id from watch/?v=, /videos/<id>, /reel/<id> or fb.watch links. */
export function parseFacebook(url: string): SourceClip | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\.|^web\./, "");
    if (host !== "facebook.com" && host !== "fb.watch") return null;
    let id = u.searchParams.get("v");
    if (!id) {
      const m = u.pathname.match(/\/(?:videos|reel)\/(?:[^/]+\/)?(\d{5,25})/);
      id = m?.[1] ?? null;
    }
    if (!id || !/^\d{5,25}$/.test(id)) return null;
    const isShort = u.pathname.startsWith("/reel/");
    return { id, isShort, provider: "facebook", url: `https://www.facebook.com/watch/?v=${id}` };
  } catch {
    return null;
  }
}

export function parseClip(url: string): SourceClip | null {
  return parseYouTube(url) ?? parseFacebook(url);
}

/** Reads shirtat.source_clips (list.url) and shirtat.source_note_en / _ar metafields. */
export async function getProductSource(handle: string): Promise<ProductSource | null> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `product-${handle}`);
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return null;
  try {
    const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({
        query: `query($h: String!) { product(handle: $h) { clips: metafield(namespace: "shirtat", key: "source_clips") { value } en: metafield(namespace: "shirtat", key: "source_note_en") { value } ar: metafield(namespace: "shirtat", key: "source_note_ar") { value } } }`,
        variables: { h: handle },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        product: {
          clips: { value: string } | null;
          en: { value: string } | null;
          ar: { value: string } | null;
        } | null;
      };
    };
    const p = json.data?.product;
    if (!p?.clips?.value) return null;
    let urls: unknown;
    try {
      urls = JSON.parse(p.clips.value);
    } catch {
      urls = [p.clips.value];
    }
    const clips = (Array.isArray(urls) ? urls : [])
      .filter((u): u is string => typeof u === "string")
      .map(parseClip)
      .filter((c): c is SourceClip => c !== null);
    if (clips.length === 0) return null;
    return { clips, noteAr: p.ar?.value, noteEn: p.en?.value };
  } catch {
    return null;
  }
}
