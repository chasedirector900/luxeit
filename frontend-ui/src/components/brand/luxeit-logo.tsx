import Image from "next/image";

/**
 * The LUXE iT badge — the same artwork as the app icon and the printed
 * branding, so the app, favicon, shirts and signage all show one mark.
 *
 * Rendered from /icon.svg (vector, so it stays crisp at any size).
 */
export function LuxeitLogo({
  size = 44,
  className = "",
  priority = false,
}: {
  /** Rendered width/height in px. The artwork is square. */
  size?: number;
  className?: string;
  /** Set on above-the-fold marks (page headers) to avoid a late paint. */
  priority?: boolean;
}) {
  return (
    <Image
      src="/icon.svg"
      alt="Luxeit"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
