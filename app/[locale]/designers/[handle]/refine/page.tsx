import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionBrowseBoundary } from "@/components/collections/collection-page";
import { DesignerBrowseResults } from "@/components/designers/designer-page";
import { readBrowseState } from "@/lib/collections/server";
import { designerProductQuery } from "@/lib/designers";
import { getDesignerMetadata } from "@/lib/designers/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/designers/[handle]/refine">): Promise<Metadata> {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) return {};
  return getDesignerMetadata(handle);
}

export default function RefinedDesignerPage({
  params,
  searchParams,
}: PageProps<"/[locale]/designers/[handle]/refine">) {
  return (
    <CollectionBrowseBoundary>
      <RefinedDesignerResults params={params} searchParams={searchParams} />
    </CollectionBrowseBoundary>
  );
}

async function RefinedDesignerResults({
  params,
  searchParams,
}: PageProps<"/[locale]/designers/[handle]/refine">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE || !designerProductQuery(handle)) notFound();
  return <DesignerBrowseResults handle={handle} statePromise={readBrowseState(searchParams)} />;
}
