import ts from "typescript";

export const fixes = {
  "raw-color":
    "Use a DESIGN.md token: text-muted-foreground, bg-card, or var(--primary); define palette literals only in the token stylesheet.",
  "arbitrary-value":
    "Use a named Tailwind/token class (text-sm, p-4, h-64, bg-card) or a block; new pages must not add inherited-code exceptions.",
  "card-markup": "Use DashboardCard or StatCard from @/components/blocks instead of a hand-rolled card surface.",
  "page-header": "Use PageHeader from @/components/blocks (SectionHeader for a card heading).",
} as const;
export type DesignRule = keyof typeof fixes;
export interface Finding {
  file: string;
  line: number;
  rule: DesignRule;
  value: string;
}
const color = /#[\da-f]{3,4}(?![\w-])|#[\da-f]{6}(?:[\da-f]{2})?(?![\w-])|\b(?:rgba?|hsla?|oklch)\([^)]*\)/gi;
const utility =
  /(?:^|:)(?:-?(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline(?:-offset)?|shadow|fill|stroke|decoration|accent|caret|from|via|to|w|h|size|min-[wh]|max-[wh]|[mp][xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|translate-[xy]|basis|grid-cols|grid-rows|auto-cols|auto-rows|font|leading|tracking|indent|rounded(?:-[trblse]{1,2})?))-(?:\[[^\n]+\]|\([^\n]+\))(?:\/[^\s]+)?!?$/;
const property =
  /(?:^|:)\[(?:--[^:]+|(?:background|color|width|height|min-width|max-width|min-height|max-height|padding|margin|gap|font[^:]*|line-height|letter-spacing|border[^:]*|fill|stroke)):[^\]]+\]$/;

// Token references and grid composition do not introduce a design-scale literal.
// Keep this lexical exemption deliberately narrow: no px/rem/em fallbacks, color
// functions, or other CSS functions can slip through alongside a variable.
function usesTokensOrLayout(candidate: string): boolean {
  if (/^(?:grid-cols|grid-rows|auto-cols|auto-rows)-(?:\[|\()/.test(candidate)) return true;
  const value = /-\[(.+)\](?:\/[^\s]+)?!?$/.exec(candidate)?.[1] ?? /^\[[^:]+:(.+)\]!?$/.exec(candidate)?.[1];
  if (value === undefined) return /-\(--[\w-]+\)(?:\/[^\s]+)?!?$/.test(candidate);
  const withoutVariables = value.replace(/var\(--[\w-]+\)/g, "0");
  const withoutViewportUnits = withoutVariables.replace(/(?:\d*\.)?\d+(?:[sld]?v[whib]|[sld]?vmin|[sld]?vmax)\b/g, "0");
  if (withoutViewportUnits === value) return false;
  return /^[\d.()+*/_\s-]+$/.test(withoutViewportUnits.replace(/calc\(/g, "("));
}

// Strings/templates are parsed so comments, JSX prose and JavaScript indexing do
// not become class names. Arbitrary selector variants are separated from values.
export function inspectDesign(file: string, source: string): Finding[] {
  const findings: Finding[] = [];
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const add = (rule: DesignRule, value: string, offset: number) => {
    findings.push({ file, line: ast.getLineAndCharacterOfPosition(offset).line + 1, rule, value });
  };
  const inspectString = (value: string, offset: number) => {
    for (const match of value.matchAll(color)) add("raw-color", match[0], offset + (match.index ?? 0));
    for (const word of value.split(/\s+/)) {
      // Splitting only at colons outside brackets preserves arbitrary variants.
      let depth = 0;
      let start = 0;
      for (let i = 0; i < word.length; i++) {
        if (word[i] === "[") depth++;
        if (word[i] === "]") depth--;
        if (word[i] === ":" && depth === 0) start = i + 1;
      }
      const candidate = word.slice(start).replace(/^!/, "");
      if ((utility.test(candidate) || property.test(candidate)) && !usesTokensOrLayout(candidate))
        add("arbitrary-value", word, offset + value.indexOf(word));
    }
  };
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      inspectString(node.text, node.getStart(ast) + 1);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (tag === "h1" && file !== "src/components/blocks/page-header.tsx")
        add("page-header", "<h1>", node.getStart(ast));
      if (["div", "section", "article", "aside"].includes(tag)) {
        const classes = node.attributes.properties.find(
          (prop) => ts.isJsxAttribute(prop) && prop.name.getText(ast) === "className",
        );
        if (classes && ts.isJsxAttribute(classes) && classes.initializer) {
          const value = classes.initializer.getText(ast);
          if (
            /\brounded(?:-[\w]+)?\b/.test(value) &&
            /\b(?:border|ring)(?:-[\w/]+)?\b/.test(value) &&
            /\bbg-(?:card|background|muted|white)\b/.test(value)
          ) {
            add("card-markup", value, classes.getStart(ast));
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  if (file.endsWith(".css")) {
    const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, (match) => " ".repeat(match.length));
    for (const match of uncommented.matchAll(color)) add("raw-color", match[0], match.index ?? 0);
  } else visit(ast);
  return findings;
}

export interface DesignException {
  file: string;
  rule: DesignRule;
  value: string;
  count: number;
  reason: string;
}
export function applyExceptions(findings: Finding[], exceptions: DesignException[]) {
  const remaining = [...findings];
  const stale: string[] = [];
  for (const entry of exceptions) {
    if (!entry.reason.trim() || entry.count < 1)
      throw new Error("Design exceptions require a reason and a positive count.");
    const matches = remaining.filter((f) => f.file === entry.file && f.rule === entry.rule && f.value === entry.value);
    if (matches.length < entry.count)
      stale.push(`${entry.file}: remove/update stale ${entry.rule} exception ${entry.value}`);
    for (const match of matches.slice(0, entry.count)) remaining.splice(remaining.indexOf(match), 1);
  }
  return { remaining, stale };
}
