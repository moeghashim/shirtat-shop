import type { BrowserContext } from "playwright";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Cache the exact public font responses between capture contexts. Never substitute
// fonts, alter CSS, ignore failures or change the application's font registry.
export async function cacheCaptureFonts(context: BrowserContext) {
  const directory = path.join(tmpdir(), "tenboards-capture-fonts");
  await mkdir(directory, { recursive: true });
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async (route) => {
    const key = createHash("sha256").update(route.request().url()).digest("hex");
    const file = path.join(directory, `${key}.json`);
    try {
      const cached = JSON.parse(await readFile(file, "utf8")) as {
        headers: Record<string, string>;
        body: string;
      };
      await route.fulfill({ status: 200, headers: cached.headers, body: Buffer.from(cached.body, "base64") });
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const response = await route.fetch({ timeout: 30000, maxRetries: 2 });
    if (!response.ok()) throw new Error(`Font asset returned ${response.status()}: ${route.request().url()}`);
    const body = await response.body();
    const headers = response.headers();
    const temporary = `${file}.${randomUUID()}`;
    await writeFile(temporary, JSON.stringify({ headers, body: body.toString("base64") }));
    await rename(temporary, file);
    await route.fulfill({ response, body });
  });
}
