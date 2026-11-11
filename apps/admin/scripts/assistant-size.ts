import { readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";

async function measure(directory: string): Promise<{ raw: number; gzip: number }> {
  const total = { raw: 0, gzip: 0 };
  for (const file of await readdir(directory)) {
    const path = `${directory}/${file}`;
    if ((await stat(path)).isDirectory()) {
      const child = await measure(path);
      total.raw += child.raw;
      total.gzip += child.gzip;
    } else if (/\.(?:m?js|css)$/.test(file)) {
      const content = await readFile(path);
      total.raw += content.byteLength;
      total.gzip += gzipSync(content).byteLength;
    }
  }
  return total;
}
console.log(
  JSON.stringify({ client: await measure(".output/public"), worker: await measure(".output/server") }, null, 2),
);
