type BrandLockupProps = {
  height?: number;
  tone?: "colour" | "ink" | "reversed";
  className?: string;
  decorative?: boolean;
};

/** Authored, outlined SVG. Header-sized instances use the small-size master. */
export function BrandLockup({
  height = 32,
  tone = "colour",
  className,
  decorative = false,
}: BrandLockupProps) {
  const suffix =
    tone === "colour" ? (height <= 32 ? "-simple" : "") : `-${tone}`;
  return (
    // A plain SVG image preserves its authored geometry and needs no optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/lockup-horizontal${suffix}.svg`}
      alt={decorative ? "" : "Do-Over"}
      aria-hidden={decorative || undefined}
      width={height * (360 / 64)}
      height={height}
      className={className}
      style={{ display: "block", width: "auto", height, maxWidth: "100%" }}
    />
  );
}
