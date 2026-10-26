import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  Header,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Modal,
  ModalOverlay,
  Popover,
} from "react-aria-components";
import { Link } from "react-router";
import type { ToolDefinition } from "@/core/tool";
import { Button, Icon } from "@/ui";
import { groupTools } from "../groupTools";
import { toolIcon } from "../toolIcon";
import { ThemeToggle } from "./ThemeToggle";
import { useMediaQuery } from "./useMediaQuery";
import styles from "./ToolsMenu.module.css";

const NARROW_QUERY = "(max-width: 719px)";

interface ToolsMenuProps {
  tools: readonly ToolDefinition[];
}

function TriggerLabel() {
  return (
    <>
      Tools
      <span className={styles.chevron} aria-hidden="true" />
    </>
  );
}

function ToolsPopover({ tools }: ToolsMenuProps) {
  const groups = groupTools(tools);
  return (
    <MenuTrigger>
      <Button variant="ghost" className={styles.trigger}>
        <TriggerLabel />
      </Button>
      <Popover placement="bottom end" offset={6} className={styles.popover}>
        <Menu
          aria-label="Tools"
          className={styles.menu}
          renderEmptyState={() => <p className={styles.empty}>No tools yet</p>}
        >
          {groups.map((group) => (
            <MenuSection key={group.id} id={group.id} className={styles.section}>
              <Header className={styles.sectionHeader}>{group.label}</Header>
              {group.tools.map((tool) => (
                <MenuItem
                  key={tool.id}
                  id={tool.id}
                  href={`#/${tool.id}`}
                  textValue={tool.name}
                  className={styles.item}
                >
                  <Icon name={toolIcon(tool)} size={16} className={styles.itemIcon} />
                  {tool.name}
                </MenuItem>
              ))}
            </MenuSection>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

function ToolsDrawer({ tools }: ToolsMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const groups = groupTools(tools);
  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button variant="ghost" className={styles.trigger}>
        <TriggerLabel />
      </Button>
      <ModalOverlay isDismissable className={styles.overlay}>
        <Modal className={styles.drawer}>
          <Dialog aria-label="Tools" className={styles.drawerDialog}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Tools</span>
              <Button variant="ghost" size="sm" onPress={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <nav aria-label="Tools" className={styles.drawerNav}>
              {groups.length === 0 && <p className={styles.empty}>No tools yet</p>}
              {groups.map((group) => (
                <section key={group.id} className={styles.drawerSection}>
                  <h2 className={styles.sectionHeader}>{group.label}</h2>
                  <ul className={styles.drawerList}>
                    {group.tools.map((tool) => (
                      <li key={tool.id}>
                        <Link to={`/${tool.id}`} className={styles.item} onClick={() => setOpen(false)}>
                          <Icon name={toolIcon(tool)} size={16} className={styles.itemIcon} />
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>
            <div className={styles.drawerFooter}>
              <span className={styles.sectionHeader}>Theme</span>
              <ThemeToggle />
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

export function ToolsMenu({ tools }: ToolsMenuProps) {
  const isNarrow = useMediaQuery(NARROW_QUERY);
  return isNarrow ? <ToolsDrawer tools={tools} /> : <ToolsPopover tools={tools} />;
}
