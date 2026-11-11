import assert from "node:assert/strict";
import { lstat, readdir, readFile, readlink, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Deliberately small YAML subset: scalar fields and a string metadata mapping.
// Reject unsupported YAML rather than silently misinterpreting it. No dependency needed.
export function parseFrontmatter(source: string): {
  fields: Record<string, string | undefined>;
  metadata: Record<string, string | undefined>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  assert.ok(match, "SKILL.md needs --- delimited frontmatter");
  const fields: Record<string, string | undefined> = Object.create(null);
  const metadata: Record<string, string | undefined> = Object.create(null);
  let inMetadata = false;
  let seenMetadata = false;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (line === "metadata:") {
      assert.ok(!seenMetadata, "duplicate metadata");
      seenMetadata = true;
      inMetadata = true;
      continue;
    }
    const entry = /^( {2})?([a-zA-Z][\w-]*): (.+)$/.exec(line);
    assert.ok(entry, `Unsupported YAML line: ${line}; use plain or quoted scalar fields`);
    const [, indent, key, raw] = entry;
    assert.ok(!indent || inMetadata, "indented field outside metadata");
    if (!indent) inMetadata = false;
    const target = indent ? metadata : fields;
    assert.ok(!Object.hasOwn(target, key), `duplicate field: ${key}`);
    let value = raw.trim();
    if (value.startsWith('"')) value = JSON.parse(value);
    else if (value.startsWith("'")) {
      assert.ok(/^'(?:[^']|'')*'$/.test(value), "invalid single-quoted string");
      value = value.slice(1, -1).replaceAll("''", "'");
    } else {
      assert.ok(
        !/^(?:[[\]{}&*!|>@`%]|true$|false$|null$|~$|[-+]?\d+(?:\.\d+)?$)/i.test(value),
        "use quoted YAML strings",
      );
      assert.ok(!/:\s|\s#/.test(value), "quote scalars containing YAML punctuation");
    }
    assert.equal(typeof value, "string", `${key} must be a string`);
    target[key] = value;
  }
  return { fields, metadata, body: match[2] };
}

export async function checkSkills(root: string) {
  const canonical = path.join(root, ".agents/skills");
  const mirror = path.join(root, ".claude/skills");
  const names = (await readdir(canonical)).sort();
  assert.ok(names.length, "No canonical skills found");
  assert.deepEqual((await readdir(mirror)).sort(), names, "Claude mirrors must match canonical inventory");
  for (const name of names) {
    const directory = path.join(canonical, name);
    assert.ok((await lstat(directory)).isDirectory(), `${name}: canonical skill must be a real directory`);
    const { fields, metadata, body } = parseFrontmatter(await readFile(path.join(directory, "SKILL.md"), "utf8"));
    assert.ok(
      typeof fields.name === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.name) && fields.name.length <= 64,
      `${name}: invalid name`,
    );
    assert.equal(fields.name, name, `${name}: name must match directory`);
    assert.ok(
      fields.description?.trim() && fields.description.length <= 1024,
      `${name}: description must be 1–1024 characters`,
    );
    assert.equal(fields.license, "MIT", `${name}: license must be MIT`);
    assert.ok(metadata.version?.trim(), `${name}: metadata.version is required`);
    const allowed = new Set(["name", "description", "license", "compatibility", "allowed-tools"]);
    for (const key of Object.keys(fields)) assert.ok(allowed.has(key), `${name}: unknown field ${key}`);
    if (fields.compatibility !== undefined)
      assert.ok(
        fields.compatibility.length > 0 && fields.compatibility.length <= 500,
        `${name}: invalid compatibility`,
      );
    assert.ok(
      body.trim() && body.trimEnd().split(/\r?\n/).length < 500,
      `${name}: body must be nonempty and under 500 lines`,
    );
    const markdown = [path.join(directory, "SKILL.md")];
    async function collect(folder: string) {
      for (const entry of await readdir(folder, { withFileTypes: true })) {
        const file = path.join(folder, entry.name);
        if (entry.isDirectory()) await collect(file);
        else if (entry.name.endsWith(".md") && !markdown.includes(file)) markdown.push(file);
      }
    }
    await collect(directory);
    for (const file of markdown) {
      const content = await readFile(file, "utf8");
      const refs = [
        ...content.matchAll(/\]\(([^)]+)\)|^\[[^\]]+\]:\s*(\S+)|`((?:references|scripts|assets)\/[^`]+)`/gm),
      ];
      for (const ref of refs) {
        const destination = (ref[1] ?? ref[2] ?? ref[3]).replace(/^<|>$/g, "");
        if (/^[a-z][a-z\d+.-]*:|^#/i.test(destination)) continue;
        assert.ok(!path.isAbsolute(destination), `${name}: use relative references`);
        const target = decodeURIComponent(destination.split(/[?#]/)[0]);
        assert.ok(
          (await stat(path.resolve(path.dirname(file), target))).isFile(),
          `${name}: missing reference ${destination}`,
        );
      }
    }
    const link = path.join(mirror, name);
    assert.ok((await lstat(link)).isSymbolicLink(), `${name}: Claude mirror must be a symlink`);
    assert.ok(!path.isAbsolute(await readlink(link)), `${name}: Claude symlink must be relative`);
    assert.equal(await realpath(link), await realpath(directory), `${name}: incorrect Claude symlink target`);
  }
  return names;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(`Skills passed: ${(await checkSkills(process.cwd())).join(", ")}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
