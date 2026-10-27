import type { ReactNode, SVGProps } from "react";
import type { IconName } from "./iconNames";

const paths: Record<IconName, ReactNode> = {
  crosshair: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
    </>
  ),
  backpack: (
    <>
      <path d="M5 9h14v12H5z" />
      <path d="M9 9V5h6v4M9 14h6v4H9z" />
    </>
  ),
  map: (
    <>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  diff: <path d="M8 3v8M4 7h8M12 18h8M19 4L5 20" />,
  chart: <path d="M4 3v17h17M8 16v-4M12 16V7M16 16v-6M20 16V9" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 11.5v1" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h12v10H2zM14 9h4l3 4v3h-7z" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />,
  tree: <path d="M10 3h4v4h-4zM4 17h4v4H4zM16 17h4v4h-4zM12 7v5M6 17v-5h12v5" />,
  box: <path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" />,
  coins: (
    <>
      <circle cx="9" cy="9" r="6" />
      <path d="M16.5 7.5a6 6 0 1 1-9 9M9 6.5v5" />
    </>
  ),
  list: <path d="M9 6h11M9 12h11M9 18h11M4 5h2v2H4zM4 11h2v2H4zM4 17h2v2H4z" />,
  hammer: <path d="M4 4h11v5H4zM15 5l5-1v5l-5-1M9.5 9v12" />,
  scroll: <path d="M6 3h9l4 4v14H6zM15 3v4h4M9 11h7M9 15h7" />,
  store: <path d="M3 9h18M5 9l1-5h12l1 5M5 9v11h14V9M10 20v-6h4v6" />,
  garage: <path d="M3 10l9-6 9 6v10H3zM7 20v-7h10v7M7 16.5h10" />,
  flag: <path d="M6 21V3M6 4h12l-3 4 3 4H6" />,
  fuel: <path d="M4 21V4h9v17M2.5 21h12M7 7h3v4H7zM13 9h3l2 2v6.5a1.5 1.5 0 0 0 3 0V8l-3-3" />,
  tent: <path d="M2 20h20M4 20l8-15 8 15M12 5v15M9 20l3-6 3 6" />,
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
