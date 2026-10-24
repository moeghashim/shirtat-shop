// Solid fabric colours for swatches. Vendor hex where published (Bella+Canvas,
// Gildan, Rabbit Skins, Tapstitch); otherwise matched by eye to vendor mockups.
const COLORS: Record<string, string> = {
  black: "#111111", white: "#ffffff", "white paper": "#fbfaf6", navy: "#1f2a44", "dark navy": "#1a2238",
  maroon: "#6b1f2a", brown: "#5b3a29", "dark chocolate": "#3b2a22", cream: "#f3ead3", "soft cream": "#f2e8d5",
  natural: "#efe6d2", ivory: "#f6f1e3", stone: "#c9c1b1", sand: "#d9c6a5", "sand dune": "#cdb592",
  grey: "#9a9a9a", gray: "#9a9a9a", heather: "#b9b9bb", "athletic heather": "#b7b7b7", "sport grey": "#a7a7a7",
  "heather grey": "#b5b5b5", "light gray": "#d3d3d1", "light grey": "#d3d3d1", "oat gray": "#d8d1c4",
  "flower gray": "#a9a7a4", "dark grey": "#4a4a4a", "dark heather": "#4b4f54", charcoal: "#3c3c3c",
  "light blue": "#a9c8e6", "sky blue": "#8fc1e3", blue: "#2b5ea7", red: "#b3202a", green: "#2f6b3d",
  "forest green": "#22432c", "army green": "#4b5320", "military green": "#5b6142", olive: "#6b6b3a",
  tan: "#c8a97e", beige: "#e3d5b8", apricot: "#f2b48c", "mild apricot": "#f6cdb0", "cream apricot": "#f8dcc4",
  pink: "#f1b8c6", "light pink": "#f6d3dc", yellow: "#f2cf43", orange: "#e46b2b", purple: "#5b3f8c",
  burgundy: "#6d1d2c", "heather navy": "#3b4660", coffee: "#5a3e2b",
};
const PATTERNS: Record<string, string> = {
  "army green with khaki camo":
    "radial-gradient(circle at 30% 30%, #c3b091 0 22%, transparent 23%), radial-gradient(circle at 72% 65%, #c3b091 0 18%, transparent 19%), radial-gradient(circle at 70% 20%, #2f3a1c 0 16%, transparent 17%), #4b5320",
  "coffee with khaki camo":
    "radial-gradient(circle at 30% 30%, #c3b091 0 22%, transparent 23%), radial-gradient(circle at 72% 65%, #c3b091 0 18%, transparent 19%), radial-gradient(circle at 70% 20%, #3a281c 0 16%, transparent 17%), #5a3e2b",
};

function isLight(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
}

export function colorFromName(name: string): { hex?: string; background?: string; light: boolean } {
  const n = name.trim().toLowerCase();
  if (PATTERNS[n]) return { background: PATTERNS[n], light: false };
  let hex: string | undefined = COLORS[n];
  if (!hex) {
    const key = Object.keys(COLORS).filter((k) => n.includes(k)).sort((a, b) => b.length - a.length)[0];
    hex = key ? COLORS[key] : undefined;
  }
  return { hex, background: hex, light: hex ? isLight(hex) : false };
}
