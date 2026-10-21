/** Square-cropped designer logo/photo, with initials when none is uploaded. */
export function DesignerAvatar({
  initials,
  name,
  size = 96,
  url,
}: {
  initials: string;
  name: string;
  size?: number;
  url: string | null;
}) {
  const style = { height: size, width: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        alt={name}
        className="shrink-0 rounded-full border border-border object-cover"
        src={url}
        style={style}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className="flex shrink-0 items-center justify-center rounded-full bg-foreground font-semibold text-background"
      style={{ ...style, fontSize: size / 2.6 }}
    >
      {initials}
    </span>
  );
}
