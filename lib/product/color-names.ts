const COLORS: Record<string, string> = {
  black: "#111111", white: "#ffffff", navy: "#1f2a44", "dark navy": "#1a2238", maroon: "#6b1f2a",
  brown: "#5b3a29", cream: "#f3ead3", natural: "#efe6d2", ivory: "#f6f1e3", "soft cream": "#f3ead3",
  grey: "#9a9a9a", gray: "#9a9a9a", "athletic heather": "#b7b7b7", "sport grey": "#a7a7a7",
  "heather grey": "#b5b5b5", "dark grey": "#4a4a4a", "dark heather": "#4b4f54", charcoal: "#3c3c3c",
  "light blue": "#a9c8e6", blue: "#2b5ea7", red: "#b3202a", green: "#2f6b3d", "forest green": "#22432c",
  "military green": "#5b6142", olive: "#6b6b3a", sand: "#d9c6a5", tan: "#c8a97e", beige: "#e3d5b8",
  pink: "#f1b8c6", "light pink": "#f6d3dc", yellow: "#f2cf43", orange: "#e46b2b", purple: "#5b3f8c",
  burgundy: "#6d1d2c", "heather navy": "#3b4660", "heather grey/black": "#8a8a8a",
};
const LIGHT = new Set(["white", "cream", "natural", "ivory", "soft cream", "light pink", "beige", "sand", "light blue"]);

export function colorFromName(name: string): { hex?: string; light: boolean } {
  const n = name.trim().toLowerCase();
  let hex: string | undefined = COLORS[n];
  let key = n;
  if (!hex) {
    key = Object.keys(COLORS).filter((k) => n.includes(k)).sort((a, b) => b.length - a.length)[0] ?? "";
    hex = key ? COLORS[key] : undefined;
  }
  return { hex, light: LIGHT.has(key) || hex === "#ffffff" };
}
