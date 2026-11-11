/** Convert the source theme to shadcn's CSS object without maintaining a second token palette. */
export type CssRules = { [key: string]: string | CssRules };

export function registryTheme(source: string) {
  // This deliberately supports the declaration/rule syntax used by styles.css.
  // Quotes and parentheses protect punctuation in selectors and function values.
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  let position = 0;
  function parse(nested = false): CssRules {
    const rules: CssRules = {};
    let start = position;
    let quote = "";
    let parentheses = 0;
    for (; position < css.length; position++) {
      const char = css[position];
      if (quote) {
        if (char === quote && css[position - 1] !== "\\") quote = "";
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === "(") parentheses++;
      if (char === ")") parentheses--;
      if (parentheses > 0) continue;
      if (char === "{") {
        const selector = css.slice(start, position).trim();
        position++;
        const child = parse(true);
        const existing = rules[selector];
        rules[selector] = { ...(typeof existing === "object" ? existing : {}), ...child };
        start = position;
        position--;
      } else if (char === ";") {
        const declaration = css.slice(start, position).trim();
        if (declaration.startsWith("@")) rules[declaration] = {};
        else {
          const colon = declaration.indexOf(":");
          if (colon < 1) throw new Error(`Unsupported theme declaration: ${declaration}`);
          rules[declaration.slice(0, colon).trim()] = declaration.slice(colon + 1).trim();
        }
        start = position + 1;
      } else if (char === "}") {
        if (!nested || css.slice(start, position).trim()) throw new Error("Unsupported theme rule ending");
        position++;
        return rules;
      }
    }
    if (nested || css.slice(start).trim()) throw new Error("Unclosed theme rule");
    return rules;
  }
  const rules = parse();
  function variables(selector: string) {
    const declarations = rules[selector];
    if (!declarations || typeof declarations === "string") throw new Error(`Missing ${selector}`);
    delete rules[selector];
    return Object.fromEntries(
      Object.entries(declarations).map(([key, value]) => {
        if (!key.startsWith("--") || typeof value !== "string") throw new Error(`Invalid variable ${key}`);
        return [key.slice(2), value];
      }),
    );
  }
  const light = variables(":root");
  // Initialized shadcn projects often define aliases (card, muted, chart-N) in .dark.
  // Reset those too, otherwise they shadow our inherited root aliases.
  const cssVars = { light, dark: { ...light, ...variables(".dark") }, theme: variables("@theme inline") };
  // Consumers already initialize Tailwind/shadcn. Presets belong to the template, not this default theme.
  for (const key of Object.keys(rules)) if (key.startsWith("@import")) delete rules[key];
  const imports = {
    '@import "@fontsource-variable/geist"': {},
    '@import "@fontsource-variable/geist-mono"': {},
  };
  const result: CssRules = { ...imports, ...rules };
  return { cssVars, css: result };
}
