import { DESIGN_FONT_VARIABLES } from "@/components/custom/fonts";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";

export function generateStaticParams() {
  return ["x", "f", "m", "fm"].map((v) => ({ v }));
}

export default async function LabPage({ params }: { params: Promise<{ v: string }> }) {
  const { v } = await params;
  return (
    <Page>
      <Container className={`${v.includes("f") ? DESIGN_FONT_VARIABLES : ""} grid gap-10`}>
        <header className="grid max-w-3xl gap-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">Design your own</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Write your sentence, pick a calligraphy style, then choose a tee, a hoodie or a mug. A
            designer finalises the artwork before anything is printed, which adds 1 to 2 days to
            production.
          </p>
        </header>
        {v.includes("m") ? <div className="min-h-[1700px] md:min-h-[860px]" /> : null}
      </Container>
    </Page>
  );
}
