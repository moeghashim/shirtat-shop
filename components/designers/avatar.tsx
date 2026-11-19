/** Square-cropped designer logo/photo, with initials when none is uploaded. */
export function DesignerAvatar({
  decorative = false,
  initials,
  name,
  shape = "circle",
  size = 96,
  url,
}: {
  decorative?: boolean;
  initials: string;
  name: string;
  shape?: "circle" | "tile";
  size?: number;
  url: string | null;
}) {
  const style = { height: size, width: size };
  const frame =
    shape === "tile" ? "rounded-2xl bg-muted object-contain" : "rounded-full object-cover";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        alt={decorative ? "" : name}
        aria-hidden={decorative ? true : undefined}
        className={`shrink-0 border border-border ${frame}`}
        src={url}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : name}
      className={`flex shrink-0 items-center justify-center bg-foreground font-semibold text-background ${shape === "tile" ? "rounded-2xl" : "rounded-full"}`}
      style={{ ...style, fontSize: size / 2.6 }}
    >
      {initials}
    </span>
  );
}
