import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import { classNames } from "./classNames";
import styles from "./Switch.module.css";

export interface SwitchProps extends Omit<AriaSwitchProps, "className" | "style"> {
  className?: string;
}

export function Switch({ className, children, ...props }: SwitchProps) {
  return (
    <AriaSwitch {...props} className={classNames(styles.switch, className)}>
      {(renderProps) => (
        <>
          <span className={styles.track} aria-hidden="true">
            <span className={styles.thumb} />
          </span>
          {typeof children === "function" ? children(renderProps) : children}
        </>
      )}
    </AriaSwitch>
  );
}
