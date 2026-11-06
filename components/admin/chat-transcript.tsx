import {
  gradeChecks,
  textDirection,
  type FrozenTurn,
  type GradedCheck,
  type ProjectedTurn,
  type TurnFeedback,
} from "@/lib/chat-review";

export function ChatTranscript({
  feedback,
  turn,
}: {
  feedback: TurnFeedback | null;
  turn: ProjectedTurn | FrozenTurn;
}) {
  const graded = feedback ? gradeChecks(turn.assistant, feedback.checks) : [];
  return (
    <article className="grid gap-4 rounded-[1.25rem] bg-[#f6f1e8] p-4">
      <header className="grid gap-1 text-sm text-foreground/70">
        <p>
          Turn <span className="font-mono text-foreground">{turn.turnId}</span>
        </p>
        <p className="break-all font-mono text-xs">{turn.version}</p>
        {turn.modelId ? <p>Model recorded on the turn: {turn.modelId}</p> : null}
      </header>
      <Message label="Shopper" text={turn.shopper} tone="shopper" />
      <Message label="Assistant" text={turn.assistant} tone="assistant" />
      {graded.length ? <Graded checks={graded} /> : null}
    </article>
  );
}

function Message({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "assistant" | "shopper";
}) {
  const direction = textDirection(text);
  return (
    <div className={tone === "shopper" ? "grid justify-items-end gap-1" : "grid gap-1"}>
      <p className="text-xs text-foreground/70">{label}</p>
      <p
        className={
          tone === "shopper"
            ? "max-w-[85%] rounded-[1.25rem] bg-[#e7dcc8] px-4 py-3 text-base leading-7 whitespace-pre-wrap"
            : "text-base leading-7 whitespace-pre-wrap"
        }
        dir={direction}
        lang={direction === "rtl" ? "ar" : "en"}
      >
        {text || "No text was recorded for this side of the turn."}
      </p>
    </div>
  );
}

function Graded({ checks }: { checks: GradedCheck[] }) {
  return (
    <ul className="grid gap-1 text-sm">
      {checks.map((check) => (
        <li key={`${check.kind}:${check.text}`}>
          {check.kind} “{check.text}”:{" "}
          {check.result === "manual" ? "manual rubric, not graded" : check.result}
        </li>
      ))}
    </ul>
  );
}
