import { useState } from "react";

import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";

/** The kit heading is also its live PageHeader example: toggle the optional description. */
export function HeaderExample() {
  const [details, setDetails] = useState(true);
  return (
    <PageHeader
      title="Blocks kit"
      description={
        details
          ? "Build with the same presentation blocks used throughout tenboards. All examples use illustrative data."
          : undefined
      }
      actions={
        <Button variant="outline" aria-pressed={details} onClick={() => setDetails(!details)}>
          Description
        </Button>
      }
    />
  );
}
