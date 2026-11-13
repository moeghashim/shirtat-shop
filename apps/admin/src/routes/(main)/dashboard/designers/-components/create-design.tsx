import { DashboardCard, SectionHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import type { DesignersView } from "../../../../../../../../lib/admin-api/types.ts";
import { CategorySelect, ProductPicks, SupplierNote } from "./product-picks";
import { type ActionNotice, useDesignerAction } from "./use-designer-action";

/** Workflow B: the owner uploads a design (ours or an approved designer's) and gets Shopify drafts. */
export function CreateFromDesign({ view, notify }: { view: DesignersView; notify: (notice: ActionNotice) => void }) {
  const { pending, submit } = useDesignerAction(notify);
  const designers = view.creators.filter((c) => c.status === "approved" && c.handle);
  return (
    <DashboardCard>
      <SectionHeader
        title="Create products from a design"
        description="Ours or a designer's. One Shopify draft per product you tick."
      />
      <CardContent>
        <details>
          <summary className="cursor-pointer text-sm font-medium">Open the form</summary>
          <form className="mt-4 grid gap-3" onSubmit={submit("create")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs" htmlFor="new-design-file">
                Design image (PNG or JPG, up to 4 MB)
                <Input accept="image/png,image/jpeg" id="new-design-file" name="design" required type="file" />
              </label>
              <label className="grid gap-1 text-xs" htmlFor="new-design-title">
                Title
                <Input id="new-design-title" maxLength={120} name="title" required />
              </label>
              <label className="grid gap-1 text-xs" htmlFor="new-design-designer">
                Designer
                <NativeSelect className="w-full" defaultValue="shirtat" id="new-design-designer" name="designer">
                  <NativeSelectOption value="shirtat">Shirtat (house designer)</NativeSelectOption>
                  {designers.map((c) => (
                    <NativeSelectOption key={c.id} value={c.handle ?? ""}>
                      {c.details?.displayName || c.name} (@{c.handle})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <CategorySelect catalog={view.catalog} id="new-design-category" matched={[]} suggested="poetry" />
              <label className="grid gap-1 text-xs" htmlFor="new-design-en">
                Description (English)
                <Textarea id="new-design-en" name="descriptionEn" rows={2} />
              </label>
              <label className="grid gap-1 text-xs" htmlFor="new-design-ar">
                Description (Arabic)
                <Textarea dir="rtl" id="new-design-ar" lang="ar" name="descriptionAr" rows={2} />
              </label>
            </div>
            <label className="flex min-h-6 items-center gap-2 text-xs">
              <input className="accent-primary size-4" defaultChecked name="autoCategory" type="checkbox" /> auto-pick
              category from title and descriptions (overrides the select)
            </label>
            <ProductPicks catalog={view.catalog} idPrefix="new-design" />
            <SupplierNote supplier={view.catalog.supplierName} />
            <div>
              <Button disabled={pending} type="submit">
                {pending ? "Creating drafts" : "Create Shopify drafts"}
              </Button>
            </div>
          </form>
        </details>
      </CardContent>
    </DashboardCard>
  );
}
