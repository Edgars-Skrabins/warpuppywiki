import {
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps as AriaTooltipProps,
} from "react-aria-components";
import type { ReactElement, ReactNode } from "react";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: AriaTooltipProps["placement"];
  delay?: number;
  isDisabled?: boolean;
}

export function Tooltip({ content, children, placement = "top", delay = 500, isDisabled }: TooltipProps) {
  return (
    <TooltipTrigger delay={delay} closeDelay={100} isDisabled={isDisabled}>
      {children}
      <AriaTooltip placement={placement} offset={8} className={styles.tooltip}>
        <OverlayArrow className={styles.arrow}>
          <svg width="10" height="5" viewBox="0 0 10 5" aria-hidden="true">
            <path d="M0 0l5 5 5-5z" />
          </svg>
        </OverlayArrow>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
