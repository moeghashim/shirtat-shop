import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CollectionBrowseBoundary,
  SearchParamsProbe,
} from "@/components/collections/collection-page";
import { DesignerBrowseResults } from "@/components/designers/designer-page";
import { designerProductQuery } from "@/lib/designers";
import { getDesignerMetadata } from "@/lib/designers/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/designers/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) return {};
  return getDesignerMetadata(handle);
}

export default function DesignerPage({
  params,
  searchParams,
}: PageProps<"/[locale]/designers/[handle]">) {
  return (
    <CollectionBrowseBoundary>
      <DefaultDesignerResults params={params} />
      <SearchParamsProbe searchParams={searchParams} />
    </CollectionBrowseBoundary>
  );
}

async function DefaultDesignerResults({
  params,
}: Pick<PageProps<"/[locale]/designers/[handle]">, "params">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE || !designerProductQuery(handle)) notFound();
  return (
    <DesignerBrowseResults
      handle={handle}
      statePromise={Promise.resolve({ dataSearch: "", filters: [] })}
    />
  );
}
