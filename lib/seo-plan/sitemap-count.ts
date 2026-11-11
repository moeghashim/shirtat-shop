export async function countIndexableSitemapUrls(input: {
  indexable: (type: string, handle: string) => Promise<boolean>;
  localeCount: number;
  paths: ReadonlySet<string>;
  resources: readonly { handle: string; type: string }[];
}): Promise<number> {
  let urls = input.paths.size * input.localeCount;
  for (const resource of input.resources) {
    if (await input.indexable(resource.type, resource.handle)) urls += input.localeCount;
  }
  return urls;
}
