import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : Promise.resolve([path.join(directory, entry.name)]),
      ),
    )
  ).flat();
}
let client = 0,
  server = 0;
for (const file of await files(".output")) {
  if (!/\.(?:js|mjs|map|html)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  assert.ok(
    !/synthetic-v07-|SYNTHETIC_(?:PRIVATE_KEY|USER_PROMPT)|x-v07-case|__assistant_probe/.test(text),
    "Test fixture or sentinel reached deployable output",
  );
  if (file.startsWith(".output/public")) {
    client++;
    assert.ok(
      !/@ai-sdk\/|createOpenAICompatible|api\.openai\.com|api\.anthropic\.com|api\.meta\.ai|generativelanguage\.googleapis\.com|ANTHROPIC_API_KEY|OPENAI_API_KEY|META_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY|XAI_API_KEY/.test(
        text,
      ),
      "Server provider code reached browser output",
    );
  } else server++;
}
console.log(
  `PASS ${client} client and ${server} server artifacts/maps: no test hooks/synthetic sentinels; no browser provider SDK/keys/endpoints`,
);
