import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent, CodeBlockHeader, CodeBlockTitle } from "@/components/ui/code-block";

export function ExampleSource({ name, source }: { name: string; source: string }) {
  const [status, setStatus] = useState("");
  return (
    <div className="min-w-0 space-y-2">
      <details>
        <summary className="w-fit cursor-pointer rounded-sm text-sm underline underline-offset-4">
          View {name} source
        </summary>
        <CodeBlock className="mt-3">
          <CodeBlockHeader className="flex-wrap">
            <CodeBlockTitle>{name}.tsx</CodeBlockTitle>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(source);
                  setStatus(`${name} source copied.`);
                } catch {
                  setStatus("Copy unavailable. Select and copy the source below.");
                }
              }}
            >
              Copy {name} source
            </Button>
          </CodeBlockHeader>
          <CodeBlockContent aria-label={`${name} source`} className="max-h-96">
            {source}
          </CodeBlockContent>
        </CodeBlock>
      </details>
      <p role="status" className="text-muted-foreground text-xs">
        {status}
      </p>
    </div>
  );
}
