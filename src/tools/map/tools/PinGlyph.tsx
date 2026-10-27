import type { ReactNode } from "react";
import type { PinIcon } from "../plan/plan";

const glyphs: Record<PinIcon, ReactNode> = {
  flag: <path d="M6 21V3M6 4h12l-3 4 3 4H6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
    </>
  ),
  skull: (
    <>
      <path d="M5 11a7 7 0 0 1 14 0v4h-2v4H7v-4H5z" />
      <path d="M9 12h1.5M13.5 12H15M10 19v-2M14 19v-2" />
    </>
  ),
  cross: <path d="M5 5l14 14M19 5L5 19" />,
  star: <path d="M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6z" />,
  circle: <circle cx="12" cy="12" r="7" />,
};

export function PinGlyph({ icon, size = 16 }: { icon: PinIcon; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {glyphs[icon]}
    </svg>
  );
}
