import type { ReactNode } from "react";

// Tiny inline SVG flags, same style as the zadar rental site (vozivespa):
// a shared 9×6 viewBox (3:2 aspect, international civil flag standard) so
// they line up perfectly side by side. Crisp at any size, unlike emoji.

export type FlagCode =
  | "DE" | "AT" | "CH" | "RO" | "LU" | "GB" | "IT" | "ES"
  | "FR" | "PL" | "NL" | "BE" | "HR" | "SI" | "CZ" | "SK"
  | "HU" | "PT" | "DK" | "SE" | "NO" | "FI" | "US";

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
  GB: (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
      <clipPath id="s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  ),
  IT: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="3" height="6" fill="#009246" />
      <rect x="3" width="3" height="6" fill="#FFF" />
      <rect x="6" width="3" height="6" fill="#CE2B37" />
    </svg>
  ),
  ES: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="6" fill="#AA151B" />
      <rect y="1.5" width="9" height="3" fill="#F1BF00" />
    </svg>
  ),
  CH: (
    <svg viewBox="0 0 9 9" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="9" fill="#D52B1E" />
      <rect x="3.75" y="1.75" width="1.5" height="5.5" fill="#FFF" />
      <rect x="1.75" y="3.75" width="5.5" height="1.5" fill="#FFF" />
    </svg>
  ),
  FR: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="3" height="6" fill="#002395" />
      <rect x="3" width="3" height="6" fill="#FFF" />
      <rect x="6" width="3" height="6" fill="#ED2939" />
    </svg>
  ),
  PL: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="3" fill="#FFF" />
      <rect y="3" width="9" height="3" fill="#DC143C" />
    </svg>
  ),
  NL: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#AE1C28" />
      <rect y="2" width="9" height="2" fill="#FFF" />
      <rect y="4" width="9" height="2" fill="#21468B" />
    </svg>
  ),
  BE: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="3" height="6" fill="#000" />
      <rect x="3" width="3" height="6" fill="#FAE042" />
      <rect x="6" width="3" height="6" fill="#ED2939" />
    </svg>
  ),
  HR: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#FF0000" />
      <rect y="2" width="9" height="2" fill="#FFF" />
      <rect y="4" width="9" height="2" fill="#171796" />
    </svg>
  ),
  SI: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#FFF" />
      <rect y="2" width="9" height="2" fill="#0000C8" />
      <rect y="4" width="9" height="2" fill="#FF0000" />
    </svg>
  ),
  CZ: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="3" fill="#FFF" />
      <rect y="3" width="9" height="3" fill="#D7141A" />
      <polygon points="0,0 4,3 0,6" fill="#11457E" />
    </svg>
  ),
  SK: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#FFF" />
      <rect y="2" width="9" height="2" fill="#0B4EA2" />
      <rect y="4" width="9" height="2" fill="#EE1C25" />
    </svg>
  ),
  HU: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#CE2939" />
      <rect y="2" width="9" height="2" fill="#FFF" />
      <rect y="4" width="9" height="2" fill="#477050" />
    </svg>
  ),
  PT: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="6" fill="#FF0000" />
      <rect width="3.6" height="6" fill="#046A38" />
    </svg>
  ),
  DK: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="6" fill="#C60C30" />
      <rect x="2.6" width="0.8" height="6" fill="#FFF" />
      <rect y="2.6" width="9" height="0.8" fill="#FFF" />
    </svg>
  ),
  SE: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="6" fill="#006AA7" />
      <rect x="2.6" width="0.8" height="6" fill="#FECC00" />
      <rect y="2.6" width="9" height="0.8" fill="#FECC00" />
    </svg>
  ),
  NO: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="6" fill="#EF2B2D" />
      <rect x="2.4" width="1" height="6" fill="#FFF" />
      <rect y="2.4" width="9" height="1" fill="#FFF" />
      <rect x="2.6" width="0.6" height="6" fill="#002868" />
      <rect y="2.6" width="9" height="0.6" fill="#002868" />
    </svg>
  ),
  FI: (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="6" fill="#FFF" />
      <rect x="2.6" width="1" height="6" fill="#003580" />
      <rect y="2.4" width="9" height="1.2" fill="#003580" />
    </svg>
  ),
  US: (
    <svg viewBox="0 0 13 7" preserveAspectRatio="xMidYMid slice">
      <rect width="13" height="7" fill="#B22234" />
      <rect y="0.54" width="13" height="0.54" fill="#FFF" />
      <rect y="1.62" width="13" height="0.54" fill="#FFF" />
      <rect y="2.69" width="13" height="0.54" fill="#FFF" />
      <rect y="3.77" width="13" height="0.54" fill="#FFF" />
      <rect y="4.85" width="13" height="0.54" fill="#FFF" />
      <rect y="5.92" width="13" height="0.54" fill="#FFF" />
      <rect width="5.2" height="3.77" fill="#3C3B6E" />
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
