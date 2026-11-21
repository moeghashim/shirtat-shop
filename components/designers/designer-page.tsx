import type { ReactNode } from "react";

import { CollectionResults } from "@/components/collections/browse";
import { CatalogBrowseLayout } from "@/components/collections/collection-page";
import { BrowseFallback } from "@/components/collections/toolbar";
import { DesignerAvatar } from "@/components/designers/avatar";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrowseState } from "@/lib/collections/types";
import { designerCopy, SHIRTAT_DESIGNER_LOGO } from "@/lib/designers";
import { fetchDesignerResults } from "@/lib/designers/server";
import type { PublicDesigner } from "@/lib/designers/types";
import { getLocale, getT } from "@/lib/i18n/server";

interface DesignerLayoutProps {
  children: ReactNode;
  designer: PublicDesigner;
}

interface DesignerBrowseResultsProps {
  handle: string;
  statePromise: Promise<BrowseState>;
}

export function DesignerLayout({ children, designer }: DesignerLayoutProps) {
  return (
    <CatalogBrowseLayout
      header={<DesignerHeader designer={designer} />}
      path={`/designers/${designer.handle}`}
      storeKey={`designer:${designer.handle}`}
    >
      {children}
    </CatalogBrowseLayout>
  );
}

export async function DesignerBrowseResults({ handle, statePromise }: DesignerBrowseResultsProps) {
  const t = await getT();
  return (
    <CollectionResults
      emptyDescription={t("No designs on sale yet. Check back soon.")}
      results={fetchDesignerResults({ handle, statePromise })}
    />
  );
}

export function DesignerPageSkeleton() {
  return (
    <Page aria-busy="true" className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <div className="flex items-start gap-5">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-3">
              <Skeleton className="h-9 w-64 sm:h-10 md:h-12 md:w-80" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
          </div>
          <BrowseFallback />
        </Sections>
      </Container>
    </Page>
  );
}

async function DesignerHeader({ designer }: { designer: PublicDesigner }) {
  const locale = await getLocale();
  const t = await getT();
  const { bio, name } = designerCopy(designer, locale);
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: t("Home"), path: "/" },
          { name: t("Designers"), path: "/designers" },
          { name, path: `/designers/${designer.handle}` },
        ]}
      />
      <div className="flex flex-wrap items-start gap-5">
        <DesignerAvatar
          initials={designer.initials}
          name={name}
          size={80}
          url={designer.avatarUrl ?? SHIRTAT_DESIGNER_LOGO}
        />
        <div className="grid gap-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl">
            <Link href={`/designers/${designer.handle}`}>{name}</Link>
          </h1>
          <p className="text-sm text-muted-foreground">
            <span dir="ltr">@{designer.handle}</span>
          </p>
          {bio ? (
            <p className="max-w-3xl whitespace-pre-line leading-6 text-muted-foreground">{bio}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
