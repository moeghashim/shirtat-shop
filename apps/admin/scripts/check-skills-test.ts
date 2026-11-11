import { checkSkills } from "./check-skills.ts";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = await mkdtemp(path.join(os.tmpdir(), "tenboards-skills-test-"));
try {
  await cp(".agents", path.join(root, ".agents"), { recursive: true, verbatimSymlinks: true });
  await cp(".claude", path.join(root, ".claude"), { recursive: true, verbatimSymlinks: true });
  await checkSkills(root);
  const file = path.join(root, ".agents/skills/tenboards-build-ui/SKILL.md");
  const source = await readFile(file, "utf8");
  const invalid = [
    source.replace("name: tenboards-build-ui", "name: Wrong--name"),
    source.replace("name: tenboards-build-ui", "name: other-name"),
    source.replace(/^description:.*$/m, `description: ${"x".repeat(1025)}`),
    source.replace(/^description:.*$/m, 'description: ""'),
    source.replace('version: "1.0"', "version: 1.0"),
    source.replace("license: MIT", "license: Apache-2.0"),
    source.replace("name: tenboards-build-ui", "name: tenboards-build-ui\nname: duplicate"),
    `${source}\n${"line\n".repeat(500)}`,
    `${source}\n[missing](references/missing.md)`,
    `${source}\n[missing][ref]\n[ref]: references/missing.md`,
    `${source}\nRead \`references/missing.md\`.`,
    source.replace("metadata:\n", "metadata: {version: 1}\n"),
    source.replace('version: "1.0"', 'version: "1.0"\ncompatibility: Node\nmetadata:\n  extra: invalid'),
  ];
  for (const candidate of invalid) {
    await writeFile(file, candidate);
    await assert.rejects(checkSkills(root));
  }
  await writeFile(file, source);
  const link = path.join(root, ".claude/skills/tenboards-build-ui");
  await unlink(link);
  await symlink("../../.agents/skills/missing", link);
  await assert.rejects(checkSkills(root));
  await unlink(link);
  await symlink(path.join(root, ".agents/skills/tenboards-build-ui"), link);
  await assert.rejects(checkSkills(root));
  await unlink(link);
  await writeFile(link, "not a symlink");
  await assert.rejects(checkSkills(root));
  console.log(`Skills validator passed: valid inventory and ${invalid.length + 3} rejection cases.`);
} finally {
  await rm(root, { recursive: true, force: true });
}
