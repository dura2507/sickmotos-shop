import type { ReactNode } from "react";

// Tiny inline SVG flags, same style as the zadar rental site (vozivespa):
// a shared 9×6 viewBox (3:2 aspect, international civil flag standard) so
// they line up perfectly side by side. Crisp at any size, unlike emoji.

export type FlagCode = "DE" | "AT" | "RO" | "LU";

const FLAGS: Record<FlagCode, ReactNode> = {
  DE: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#000" />
      <rect y="2" width="9" height="2" fill="#D00" />
      <rect y="4" width="9" height="2" fill="#FFCE00" />
    </svg>
  ),
  AT: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#C8102E" />
      <rect y="2" width="9" height="2" fill="#FFF" />
      <rect y="4" width="9" height="2" fill="#C8102E" />
    </svg>
  ),
  RO: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="3" height="6" fill="#002B7F" />
      <rect x="3" width="3" height="6" fill="#FCD116" />
      <rect x="6" width="3" height="6" fill="#CE1126" />
    </svg>
  ),
  LU: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#ED2939" />
      <rect y="2" width="9" height="2" fill="#FFF" />
      <rect y="4" width="9" height="2" fill="#00A1DE" />
    </svg>
  ),
};

export function Flag({
  code,
  className,
}: {
  code: FlagCode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block overflow-hidden rounded-[1px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)] [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className ?? "h-3 w-4"}`}
      aria-hidden
    >
      {FLAGS[code]}
    </span>
  );
}
