import type { ReactNode } from "react";
import { useWorldData, WORLDS, type World } from "@/core/data";
import { Tab, TabList, TabPanel, Tabs } from "@/ui";
import styles from "./WorldTabs.module.css";

export interface WorldTabsProps {
  world: World;
  onWorldChange: (world: World) => void;
  children: ReactNode;
}

function isWorld(key: unknown): key is World {
  return WORLDS.some((world) => world === key);
}

function WorldName({ world }: { world: World }) {
  const map = useWorldData(world, "map");
  return map.status === "success" ? map.data.name : world;
}

export function WorldTabs({ world, onWorldChange, children }: WorldTabsProps) {
  return (
    <Tabs selectedKey={world} onSelectionChange={(key) => isWorld(key) && onWorldChange(key)}>
      <TabList aria-label="World">
        {WORLDS.map((id) => (
          <Tab key={id} id={id}>
            <WorldName world={id} />
          </Tab>
        ))}
      </TabList>
      <TabPanel id={world} className={styles.panel}>
        {children}
      </TabPanel>
    </Tabs>
  );
}
