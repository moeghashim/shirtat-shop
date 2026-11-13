import type { Bilingual, PrintMethod, ProductSpecs } from "./specs";

/**
 * Metafields are hand-edited JSON, so a missing array or wrong type must degrade to "unknown"
 * instead of crashing the product page. Every consumer reads the shapes returned here.
 */

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function bilingual(value: unknown): Bilingual | null {
  if (!isRecord(value)) return null;
  const en = text(value.en);
  const ar = text(value.ar);
  if (!en && !ar) return null;
  return { en: en ?? ar!, ar: ar ?? en! };
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseJson(value: string | undefined | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parsePrintMethod(value: string | undefined | null): PrintMethod | null {
  const raw = parseJson(value);
  if (!isRecord(raw)) return null;
  const available = Array.isArray(raw.available)
    ? raw.available.flatMap((option) => {
        if (!isRecord(option)) return [];
        const method = text(option.method);
        if (!method) return [];
        const areas = Array.isArray(option.areas)
          ? option.areas.map(bilingual).filter((area): area is Bilingual => area !== null)
          : [];
        return [{ method, areas }];
      })
    : [];
  return {
    available,
    method: bilingual(raw.method),
    placement: bilingual(raw.placement),
    printArea: text(raw.printArea),
    source: text(raw.source) ?? "",
    vendor: text(raw.vendor) ?? "",
  };
}

function sizeChart(value: unknown): ProductSpecs["sizeChart"] {
  if (!isRecord(value) || !Array.isArray(value.columns)) return null;
  const sizes = strings(value.sizes);
  const columns = value.columns.flatMap((column) => {
    const label = bilingual(column);
    if (!label || !isRecord(column)) return [];
    return [{ ...label, values: strings(column.values) }];
  });
  if (!sizes.length || !columns.length) return null;
  return { columns, sizes, unit: "cm" };
}

export function parseProductSpecs(value: string | undefined | null): ProductSpecs | null {
  const raw = parseJson(value);
  if (!isRecord(raw)) return null;
  const vendor = text(raw.vendor) ?? "";
  const blankAr = text(raw.blankAr);
  return {
    blank: text(raw.blank) ?? "",
    ...(blankAr ? { blankAr } : {}),
    care: bilingual(raw.care),
    fabric: bilingual(raw.fabric),
    fit: bilingual(raw.fit),
    origin: bilingual(raw.origin),
    provider: text(raw.provider) ?? vendor,
    sizeChart: sizeChart(raw.sizeChart),
    sizes: strings(raw.sizes),
    source: text(raw.source) ?? "",
    vendor,
    weight: text(raw.weight),
  };
}
