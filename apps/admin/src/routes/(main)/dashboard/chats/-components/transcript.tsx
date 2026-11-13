import type { ChatTurnView } from "../../../../../../../../lib/admin-api/types.ts";

function direction(text: string): "ltr" | "rtl" {
  const arabic = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  return arabic > latin ? "rtl" : "ltr";
}

function Message({ label, text, shopper }: { label: string; text: string; shopper?: boolean }) {
  const dir = direction(text);
  return (
    <div className={shopper ? "grid justify-items-end gap-1" : "grid gap-1"}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={
          shopper
            ? "bg-secondary text-secondary-foreground max-w-prose rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap"
            : "text-sm leading-7 whitespace-pre-wrap"
        }
        dir={dir}
        lang={dir === "rtl" ? "ar" : "en"}
      >
        {text || "No text was recorded for this side of the turn."}
      </p>
    </div>
  );
}

export function Transcript({ view }: { view: ChatTurnView }) {
  const { turn, graded } = view;
  return (
    <div className="grid gap-4">
      <header className="text-muted-foreground grid gap-1 text-sm">
        <p>
          Turn <span className="text-foreground font-mono">{turn.turnId}</span>
        </p>
        <p className="font-mono text-xs break-all">{turn.version}</p>
        {turn.modelId ? <p>Model recorded on the turn: {turn.modelId}</p> : null}
      </header>
      <Message label="Shopper" shopper text={turn.shopper} />
      <Message label="Assistant" text={turn.assistant} />
      {graded.length ? (
        <ul className="grid gap-1 text-sm">
          {graded.map((check) => (
            <li key={`${check.kind}:${check.text}`}>
              {check.kind} “{check.text}”: {check.result === "manual" ? "manual rubric, not graded" : check.result}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
