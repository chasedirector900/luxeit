import Image from "next/image";

type LogoVariant = "mark" | "full";

const SOURCES: Record<LogoVariant, string> = {
  // Interface mark: ring + wordmark only. Stays legible from ~40px up.
  mark: "/logo-mark.svg",
  // Full badge (adds "ACCESSORIES" and the ZM tag) — those details fall under
  // 2px in a header and smudge, so only use this where the logo is shown large.
  full: "/icon.svg",
};

/**
 * The LUXE iT logo — the same artwork as the app icon and the printed branding,
 * so the app, favicon, shirts and signage all show one mark.
 */
export function LuxeitLogo({
  size = 44,
  variant = "mark",
  className = "",
  priority = false,
}: {
  /** Rendered width/height in px. The artwork is square. */
  size?: number;
  /** "mark" for interface use; "full" for large, standalone display. */
  variant?: LogoVariant;
  className?: string;
  /** Set on above-the-fold marks (page headers) to avoid a late paint. */
  priority?: boolean;
}) {
  return (
    <Image
      src={SOURCES[variant]}
      alt="Luxeit"
      width={size}
      height={size}
      priority={priority}
      // Serve the SVG as-is: the optimiser would rasterise it to the requested
      // width, which then softens on high-DPI phones.
      unoptimized
      className={className}
    />
  );
}
