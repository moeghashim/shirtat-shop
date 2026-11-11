// Presentation metadata for typed metric values. Templates contain labels and
// placeholders, never a second copy of the numeric business value.
export type MetricUnit = "count" | "percent" | "currency" | "duration" | "ratio";
export type MetricPart = {
  value: string;
  unit: MetricUnit;
  currency: string | null;
  prefix: string;
  decimals: number;
  grouped: boolean;
  scale: number;
  leadingDecimal: boolean;
};
export function splitMetric(value: string | number, unit: MetricUnit = "count") {
  if (typeof value === "number")
    return {
      template: "{0}",
      numeric: true,
      parts: [
        {
          value: String(value),
          unit,
          currency: unit === "currency" ? "USD" : null,
          prefix: "",
          decimals: 0,
          grouped: false,
          scale: 1,
          leadingDecimal: false,
        },
      ],
    };
  const parts: MetricPart[] = [];
  const template = value.replace(/[+−-]?\$?(?:\d[\d,]*(?:\.\d+)?|\.\d+)/g, (token: string, offset: number) => {
    const prefix = token.match(/^[+−$-]+/)?.[0] ?? "";
    const digits = token.slice(prefix.length);
    const suffix = value.slice(offset + token.length);
    const scale = /^[kK]\b/.test(suffix) ? 1000 : 1;
    let actualUnit = unit;
    if (prefix.includes("$")) actualUnit = "currency";
    else if (/^%|^pp\b/.test(suffix)) actualUnit = "percent";
    else if (/^x\b/.test(suffix)) actualUnit = "ratio";
    else if (/^\s*(days?|d\b|months?\b|minutes?\b)/.test(suffix)) actualUnit = "duration";
    const amount = Number(digits.replaceAll(",", "")) * (prefix.includes("-") || prefix.includes("−") ? -1 : 1) * scale;
    parts.push({
      value: String(amount),
      unit: actualUnit,
      currency: actualUnit === "currency" ? "USD" : null,
      prefix,
      decimals: digits.split(".")[1]?.length ?? 0,
      grouped: digits.includes(","),
      scale,
      leadingDecimal: digits.startsWith("."),
    });
    return `{${parts.length - 1}}`;
  });
  if (!parts.length) throw new Error("A metric requires a numeric value");
  return { template, numeric: false, parts };
}
export function joinMetric(template: string, numeric: boolean, parts: MetricPart[]): string | number {
  if (numeric) {
    const part = parts[0];
    if (!part) throw new Error("Missing metric value");
    return Number(part.value);
  }
  return template.replace(/\{(\d+)\}/g, (_, index: string) => {
    const p = parts[Number(index)];
    if (!p) throw new Error("Missing metric part");
    let value = (Math.abs(Number(p.value)) / p.scale).toLocaleString("en-US", {
      minimumFractionDigits: p.decimals,
      maximumFractionDigits: p.decimals,
      useGrouping: p.grouped,
    });
    if (p.leadingDecimal) value = value.slice(1);
    return p.prefix + value;
  });
}
