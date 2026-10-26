import { Dialog as AriaDialog, DialogTrigger, Heading, Modal, ModalOverlay } from "react-aria-components";
import type { ReactNode } from "react";
import { CloseIcon } from "./icons";
import { IconButton } from "./IconButton";
import { classNames } from "./classNames";
import styles from "./Dialog.module.css";

export { DialogTrigger };

export interface DialogProps {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode | ((close: () => void) => ReactNode);
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  isDismissable?: boolean;
  size?: "sm" | "md" | "lg";
  role?: "dialog" | "alertdialog";
}

export function Dialog({
  title,
  children,
  actions,
  isOpen,
  onOpenChange,
  isDismissable = true,
  size = "md",
  role = "dialog",
}: DialogProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable && role === "dialog"}
      className={styles.overlay}
    >
      <Modal className={classNames(styles.modal, styles[size])}>
        <AriaDialog role={role} className={styles.dialog}>
          {({ close }) => (
            <>
              <header className={styles.header}>
                <Heading slot="title" className={styles.title}>
                  {title}
                </Heading>
                {role === "dialog" && (
                  <IconButton aria-label="Close" size="sm" onPress={close}>
                    <CloseIcon />
                  </IconButton>
                )}
              </header>
              <div className={styles.body}>{children}</div>
              {actions !== undefined && (
                <footer className={styles.actions}>{typeof actions === "function" ? actions(close) : actions}</footer>
              )}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
