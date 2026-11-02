#!/usr/bin/env node
/**
 * Turns the SVGs exported from arabicdesign.ai into print-ready PNGs for a custom-text order, stores
 * them through the site, and creates the HELD Printify order. Add the approve-pod tag to the Shopify
 * order afterwards to send it to production.
 *
 *   pnpm custom-order --order A-1008 --line 1:art.svg [--line 2:other.svg] [--dry-run]
 *
 * Products for --preview --product: tee, tee-women, hoodie, mug-us-11, mug-us-15, mug-eu-11, mug-eu-15.
 * Options: --ink "#ffffff"   recolour every fill (light ink for dark garments)
 *          --drop-white      remove white fills (a white background exported with the art)
 *          --margin 0.06     empty border as a fraction of the print area (default 0.06)
 *          --text-font f.ttf render the order's text with that font instead of an SVG (--line 1:text)
 *          --out dir         where PNGs are written (default ./custom-orders)
 *          --env-file path   extra env file (default ~/.secrets/shirtat-shopify.env and ~/.secrets/custom-order.env)
 * Env: PRINTIFY_API_TOKEN, CUSTOM_ORDER_TOKEN; Shopify admin client id/secret for the order lookup.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "lib/catalog/printify-catalog.json"), "utf8"),
);
const { euMugCountries } = JSON.parse(
  fs.readFileSync(path.join(root, "lib/custom/regions.json"), "utf8"),
);
const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "shirtatco.myshopify.com";

function args() {
  const out = { lines: [], flags: {} };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (!k.startsWith("--")) continue;
    const name = k.slice(2);
    const bool = ["dry-run", "drop-white", "help"].includes(name);
    const v = bool ? true : a[++i];
    if (name === "line") out.lines.push(v);
    else if (name === "svg") out.lines.push(`1:${v}`);
    else out.flags[name] = v;
  }
  return out;
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const l of fs.readFileSync(file, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

function need(name) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
  return process.env[name];
}

async function printify(method, p, body) {
  const res = await fetch(`https://api.printify.com/v1${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${need("PRINTIFY_API_TOKEN")}`,
      "Content-Type": "application/json",
      "User-Agent": "shirtat.co",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Printify ${method} ${p}: ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

async function shopifyGraphql(query, variables) {
  const tokenRes = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: need("SHOPIFY_ADMIN_CLIENT_ID"),
      client_secret: need("SHOPIFY_ADMIN_CLIENT_SECRET"),
    }),
  });
  const { access_token } = await tokenRes.json();
  if (!access_token) throw new Error("Could not get a Shopify Admin token");
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": access_token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`Shopify: ${JSON.stringify(json.errors).slice(0, 300)}`);
  return json.data;
}

async function loadOrder(ref) {
  const q = /^\d+$/.test(ref) ? `id:${ref}` : `name:${ref.startsWith("#") ? ref : `#${ref}`}`;
  const data = await shopifyGraphql(
    `query($q: String!) { orders(first: 1, query: $q) { nodes { id legacyResourceId name email tags
      shippingAddress { firstName lastName address1 address2 city countryCodeV2 provinceCode zip phone }
      lineItems(first: 50) { nodes { sku quantity title variantTitle customAttributes { key value } } } } } }`,
    { q },
  );
  const order = data.orders.nodes[0];
  if (!order) throw new Error(`Order ${ref} not found`);
  return order;
}

const GARMENT_CATALOGS = {
  HOODIE: [["hoodie", "Unisex"]],
  TEE: [["t-shirt", "Men's"], ["t-shirt-women", "Women's"]],
};

function targetFor(sku, country) {
  const garment = sku.match(/^CUS-(TEE|HOODIE)-(\d+)$/);
  if (garment) {
    for (const [key, fit] of GARMENT_CATALOGS[garment[1]]) {
      const cat = catalog[key];
      for (const sizes of Object.values(cat.variants))
        for (const v of Object.values(sizes))
          if (v.id === Number(garment[2]))
            return { blueprintId: cat.blueprintId, providerId: cat.providerId, variantId: v.id, cost: v.cost, fit, label: `${garment[1].toLowerCase()} ${fit}` };
    }
    throw new Error(`Unknown variant in ${sku}`);
  }
  const mug = sku.match(/^CUS-MUG-(US|EU)-(11|15)$/);
  if (!mug) throw new Error(`Not a custom SKU: ${sku}`);
  const want = mug[1].toLowerCase();
  const region = country === "US" ? "us" : euMugCountries.includes(country) ? "eu" : null;
  if (!region) throw new Error(`Custom mugs cannot ship to ${country}`);
  if (region !== want)
    console.warn(
      `! SKU says ${want.toUpperCase()} but the address is ${country}; using the ${region.toUpperCase()} provider.`,
    );
  const cat = catalog[`mug-${region}`];
  const v = cat.variants.White[`${mug[2]}oz`];
  return {
    blueprintId: cat.blueprintId,
    providerId: cat.providerId,
    variantId: v.id,
    cost: v.cost,
    label: `mug ${region.toUpperCase()}`,
  };
}

async function printArea(t) {
  const res = await printify(
    "GET",
    `/catalog/blueprints/${t.blueprintId}/print_providers/${t.providerId}/variants.json`,
  );
  const variant = res.variants.find((v) => v.id === t.variantId);
  const front = variant?.placeholders.find((p) => p.position === "front");
  if (!front) throw new Error("No front print area for this variant");
  return { width: front.width, height: front.height };
}

function recolour(svg, ink) {
  const keep = /^(none|transparent|url\(.*\)|currentcolor)$/i;
  return svg
    .replace(/\bfill="([^"]*)"/gi, (m, c) => (keep.test(c.trim()) ? m : `fill="${ink}"`))
    .replace(/fill\s*:\s*([^;"']+)/gi, (m, c) => (keep.test(c.trim()) ? m : `fill:${ink}`));
}

function dropWhite(svg) {
  const white = String.raw`(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))`;
  return svg
    .replace(
      new RegExp(
        String.raw`<(rect|path|circle|ellipse|polygon)\b[^>]*\bfill="${white}"[^>]*?(?:/>|>\s*</\1>)`,
        "gi",
      ),
      "",
    )
    .replace(
      new RegExp(
        String.raw`<(rect|path|circle|ellipse|polygon)\b[^>]*fill\s*:\s*${white}[^>]*?(?:/>|>\s*</\1>)`,
        "gi",
      ),
      "",
    );
}

function textSvg(text, fontFile) {
  const esc = text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const size = 400;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="900" viewBox="0 0 3000 900"><text x="1500" y="560" text-anchor="middle" direction="auto" font-family="CustomFont" font-size="${size}" fill="#111111">${esc}</text></svg>`;
}

/** Fits the artwork's visible bounds inside a transparent W×H canvas and returns PNG bytes. */
function rasterise(svgSource, { width, height }, { ink, margin, dropWhiteFill, fontFile }) {
  let svg = svgSource;
  if (!dropWhiteFill && /<rect\b[^>]*fill="(#fff(fff)?|white)"/i.test(svg))
    console.warn(
      "! The SVG has a white rectangle, probably a background. Add --drop-white if the print should not have it.",
    );
  if (dropWhiteFill) svg = dropWhite(svg);
  if (ink) svg = recolour(svg, ink);
  const fontOptions = fontFile
    ? { fontFiles: [fontFile], loadSystemFonts: false, defaultFontFamily: "CustomFont" }
    : { loadSystemFonts: true };
  const probe = new Resvg(svg, { font: fontOptions });
  const box = probe.getBBox();
  if (!box || box.width <= 0 || box.height <= 0)
    throw new Error("The SVG has nothing visible to print");
  const open = svg.match(/<svg\b[^>]*>/i);
  if (!open) throw new Error("Not an SVG file");
  const inner = svg.slice(open.index + open[0].length).replace(/<\/svg>\s*$/i, "");
  const mx = width * margin;
  const my = height * margin;
  const wrapper =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<svg x="${mx}" y="${my}" width="${width - 2 * mx}" height="${height - 2 * my}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" preserveAspectRatio="xMidYMid meet" overflow="hidden">${inner}</svg></svg>`;
  const img = new Resvg(wrapper, {
    fitTo: { mode: "width", value: width },
    font: fontOptions,
  }).render();
  if (img.width !== width || img.height !== height)
    throw new Error(`Rendered ${img.width}×${img.height}, expected ${width}×${height}`);
  return { png: img.asPng(), box };
}

function pngHasTransparency(png) {
  const img = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"><image width="10" height="10" xlink:href="data:image/png;base64,${png.toString("base64")}"/></svg>`,
  ).render();
  const px = img.pixels;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) return true;
  return false;
}

async function upload(png, name) {
  const site = process.env.SITE_URL ?? "https://shirtat.co";
  const res = await fetch(`${site}/api/custom/upload?name=${encodeURIComponent(name)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${need("CUSTOM_ORDER_TOKEN")}`, "Content-Type": "image/png" },
    body: png,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/** Rasterise an SVG without an order, to check how it will fit: --preview art.svg --product tee|tee-women|hoodie|mug-us-11|mug-eu-15 */
async function preview(flags) {
  loadEnv(path.join(os.homedir(), ".secrets/custom-order.env"));
  const product = String(flags.product ?? "tee");
  const first = (key) => Object.values(Object.values(catalog[key].variants)[0])[0].id;
  const PREVIEW_SKUS = {
    tee: `CUS-TEE-${first("t-shirt")}`,
    "tee-women": `CUS-TEE-${first("t-shirt-women")}`,
    hoodie: `CUS-HOODIE-${first("hoodie")}`,
  };
  const mugKey = product.match(/^mug-(us|eu)-(11|15)$/);
  const sku = PREVIEW_SKUS[product] ?? (mugKey ? `CUS-MUG-${mugKey[1].toUpperCase()}-${mugKey[2]}` : null);
  if (!sku) throw new Error(`Unknown --product "${product}". Use tee, tee-women, hoodie, mug-us-11, mug-us-15, mug-eu-11 or mug-eu-15.`);
  const target = targetFor(sku, product.startsWith("mug-eu") ? "DE" : "US");
  const area = await printArea(target);
  const { png, box } = rasterise(
    fs.readFileSync(path.resolve(String(flags.preview)), "utf8"),
    area,
    {
      ink: flags.ink,
      margin: flags.margin ? Number(flags.margin) : 0.06,
      dropWhiteFill: Boolean(flags["drop-white"]),
    },
  );
  const out = path.resolve(String(flags.out ?? "preview.png"));
  fs.writeFileSync(out, png);
  console.log(
    `${target.label}: print area ${area.width}×${area.height}px → ${out} (art ${Math.round(box.width)}×${Math.round(box.height)}, transparent: ${pngHasTransparency(png) ? "yes" : "NO"})`,
  );
}

async function main() {
  const { lines, flags } = args();
  if (flags.preview) return preview(flags);
  if (flags.help || !flags.order || !lines.length) {
    console.log(
      fs
        .readFileSync(fileURLToPath(import.meta.url), "utf8")
        .split("*/")[0]
        .replace(/^#!.*\n\/\*\*?/, "")
        .replace(/^ \* ?/gm, ""),
    );
    process.exit(flags.help ? 0 : 1);
  }
  loadEnv(flags["env-file"] ?? path.join(os.homedir(), ".secrets/shirtat-shopify.env"));
  loadEnv(path.join(os.homedir(), ".secrets/custom-order.env"));
  const dry = Boolean(flags["dry-run"]);
  const margin = flags.margin ? Number(flags.margin) : 0.06;
  const outDir = path.resolve(flags.out ?? "custom-orders");
  fs.mkdirSync(outDir, { recursive: true });

  const order = await loadOrder(String(flags.order));
  const addr = order.shippingAddress;
  if (!addr) throw new Error("The order has no shipping address");
  const customLines = order.lineItems.nodes.filter((l) => l.sku?.startsWith("CUS-"));
  if (!customLines.length) throw new Error(`${order.name} has no custom lines`);
  console.log(
    `${order.name}: ${customLines.length} custom line(s), ships to ${addr.countryCodeV2}`,
  );

  const items = [];
  for (const spec of lines) {
    const m = String(spec).match(/^(\d+):(.+)$/);
    if (!m) throw new Error(`Bad --line "${spec}" (use N:file.svg)`);
    const n = Number(m[1]);
    const line = customLines[n - 1];
    if (!line) throw new Error(`No custom line ${n}`);
    const attrs = Object.fromEntries(line.customAttributes.map((a) => [a.key, a.value]));
    const target = targetFor(line.sku, addr.countryCodeV2);
    const area = await printArea(target);
    const useText = flags["text-font"] && m[2] === "text";
    const svgText = useText
      ? textSvg(attrs.Text ?? "", flags["text-font"])
      : fs.readFileSync(path.resolve(m[2]), "utf8");
    const { png, box } = rasterise(svgText, area, {
      ink: flags.ink,
      margin,
      dropWhiteFill: Boolean(flags["drop-white"]),
      fontFile: useText ? path.resolve(flags["text-font"]) : undefined,
    });
    const file = path.join(outDir, `${order.name.replace("#", "")}-L${n}.png`);
    fs.writeFileSync(file, png);
    const transparent = pngHasTransparency(png);
    console.log(`line ${n}: ${line.title} · text "${attrs.Text ?? ""}" · ${attrs.Style ?? ""}${target.fit ? ` · fit ${attrs.Fit ?? target.fit}` : ""}`);
    if (target.fit && attrs.Fit && !attrs.Fit.startsWith(target.fit.slice(0, 3))) console.warn(`! Fit property "${attrs.Fit}" does not match the SKU (${target.fit}); the SKU decides what is printed.`);
    console.log(
      `  ${target.label}: blueprint ${target.blueprintId} provider ${target.providerId} variant ${target.variantId} · Printify cost $${target.cost}`,
    );
    console.log(
      `  print area ${area.width}×${area.height}px → ${file} (${(png.length / 1e6).toFixed(1)} MB, art ${Math.round(box.width)}×${Math.round(box.height)} fitted, transparent background: ${transparent ? "yes" : "NO — use --drop-white"})`,
    );
    if (!transparent && !dry)
      throw new Error("The PNG has no transparent background. Fix the SVG or pass --drop-white.");
    items.push({ n, line, target, png, file });
  }
  if (dry)
    return console.log(
      "Dry run: nothing uploaded and no Printify order created. Open the PNGs and check them.",
    );

  const shopId = process.env.PRINTIFY_SHOP_ID ?? (await printify("GET", "/shops.json"))[0].id;
  const existing = (await printify("GET", `/shops/${shopId}/orders.json?limit=50`)).data ?? [];
  const base = `shopify-${order.legacyResourceId}`;
  const taken = existing.some((o) => o.external_id === base || o.metadata?.shop_order_id === base);
  const externalId = taken ? `${base}-custom` : base;
  if (existing.some((o) => o.external_id === externalId))
    throw new Error(`A Printify order ${externalId} already exists. Send all lines in one run.`);

  const lineItems = [];
  for (const it of items) {
    const { url } = await upload(it.png, `${order.name.replace("#", "")}-L${it.n}`);
    console.log(`line ${it.n}: uploaded`);
    lineItems.push({
      blueprint_id: it.target.blueprintId,
      print_provider_id: it.target.providerId,
      variant_id: it.target.variantId,
      quantity: it.line.quantity,
      print_areas: { front: url },
    });
  }
  const created = await printify("POST", `/shops/${shopId}/orders.json`, {
    external_id: externalId,
    label: order.name,
    line_items: lineItems,
    shipping_method: 1,
    send_shipping_notification: false,
    address_to: {
      first_name: addr.firstName ?? "",
      last_name: addr.lastName ?? "",
      email: order.email ?? "",
      phone: addr.phone ?? "",
      country: addr.countryCodeV2,
      region: addr.provinceCode ?? "",
      address1: addr.address1 ?? "",
      address2: addr.address2 ?? "",
      city: addr.city ?? "",
      zip: addr.zip ?? "",
    },
  });
  const check = await printify("GET", `/shops/${shopId}/orders/${created.id}.json`);
  console.log(`Printify order ${created.id} (${externalId}) status: ${check.status}`);
  if (check.status !== "on-hold")
    console.warn("! Expected on-hold. Check it in Printify before doing anything else.");
  console.log(
    `Next: review it in Printify, then add the approve-pod tag to ${order.name} in Shopify.`,
  );
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
