import { Fragment } from "react";

import { Link } from "@/components/ui/link";
import { linkProductMentions } from "@/lib/content";

export function LinkedText({ text }: { text: string }) {
  const segments = linkProductMentions(text);
  return segments.map((segment, index) =>
    segment.href ? (
      <Link
        key={`${segment.href}-${index}`}
        className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        href={segment.href}
      >
        {segment.text}
      </Link>
    ) : (
      <Fragment key={index}>{segment.text}</Fragment>
    ),
  );
}
