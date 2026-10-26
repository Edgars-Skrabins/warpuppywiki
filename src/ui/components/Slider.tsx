import {
  Label,
  Slider as AriaSlider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  type SliderProps as AriaSliderProps,
} from "react-aria-components";
import { formatNumber } from "../format";
import { classNames } from "./classNames";
import fieldStyles from "./Field.module.css";
import styles from "./Slider.module.css";

export interface SliderProps extends Omit<AriaSliderProps<number>, "className" | "style" | "children"> {
  label: string;
  unit?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function Slider({ label, unit, formatValue, className, ...props }: SliderProps) {
  const display = (value: number) => formatValue?.(value) ?? `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
  return (
    <AriaSlider {...props} className={classNames(styles.slider, className)}>
      <div className={styles.header}>
        <Label className={fieldStyles.label}>{label}</Label>
        <SliderOutput className={styles.output}>{({ state }) => display(state.getThumbValue(0))}</SliderOutput>
      </div>
      <SliderTrack className={styles.track}>
        {({ state }) => (
          <>
            <span className={styles.rail} />
            <span className={styles.fill} style={{ width: `${state.getThumbPercent(0) * 100}%` }} />
            <SliderThumb className={styles.thumb} aria-valuetext={display(state.getThumbValue(0))} />
          </>
        )}
      </SliderTrack>
    </AriaSlider>
  );
}
