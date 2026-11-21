import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DesignerLayout, DesignerPageSkeleton } from "@/components/designers/designer-page";
import { getPublicDesigner } from "@/lib/designers/server";
import { PLACEHOLDER_HANDLE } from "@/lib/static-params";

export function generateStaticParams() {
  return [{ handle: PLACEHOLDER_HANDLE }];
}

export default function DesignerHandleLayout({
  children,
  params,
}: LayoutProps<"/[locale]/designers/[handle]">) {
  return (
    <Suspense fallback={<DesignerPageSkeleton />}>
      <DesignerHandleLayoutContent params={params}>{children}</DesignerHandleLayoutContent>
    </Suspense>
  );
}

async function DesignerHandleLayoutContent({
  children,
  params,
}: Pick<LayoutProps<"/[locale]/designers/[handle]">, "children" | "params">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  await connection();
  const designer = await getPublicDesigner(handle).catch(() => null);
  if (!designer) notFound();
  return <DesignerLayout designer={designer}>{children}</DesignerLayout>;
}
