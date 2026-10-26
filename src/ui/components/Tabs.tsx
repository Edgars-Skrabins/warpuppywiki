import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type TabListProps as AriaTabListProps,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";
import { classNames } from "./classNames";
import styles from "./Tabs.module.css";

export interface TabsProps extends Omit<AriaTabsProps, "className" | "style"> {
  className?: string;
}

export function Tabs({ className, ...props }: TabsProps) {
  return <AriaTabs {...props} className={classNames(styles.tabs, className)} />;
}

export interface TabListProps<T> extends Omit<AriaTabListProps<T>, "className" | "style"> {
  className?: string;
}

export function TabList<T extends object>({ className, ...props }: TabListProps<T>) {
  return <AriaTabList {...props} className={classNames(styles.tabList, className)} />;
}

export interface TabProps extends Omit<AriaTabProps, "className" | "style"> {
  className?: string;
}

export function Tab({ className, ...props }: TabProps) {
  return <AriaTab {...props} className={classNames(styles.tab, className)} />;
}

export interface TabPanelProps extends Omit<AriaTabPanelProps, "className" | "style"> {
  className?: string;
}

export function TabPanel({ className, ...props }: TabPanelProps) {
  return <AriaTabPanel {...props} className={classNames(styles.tabPanel, className)} />;
}
