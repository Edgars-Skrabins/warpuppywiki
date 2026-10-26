import type { ReactNode } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@/ui";

export interface RoleTabsProps {
  roles: readonly string[];
  selected: string;
  roleLabel: (role: string) => string;
  onSelect: (role: string) => void;
  children: ReactNode;
}

export function RoleTabs({ roles, selected, roleLabel, onSelect, children }: RoleTabsProps) {
  return (
    <Tabs selectedKey={selected} onSelectionChange={(key) => onSelect(String(key))}>
      <TabList aria-label="Roles">
        {roles.map((role) => (
          <Tab key={role} id={role}>
            {roleLabel(role)}
          </Tab>
        ))}
      </TabList>
      <TabPanel id={selected}>{children}</TabPanel>
    </Tabs>
  );
}
