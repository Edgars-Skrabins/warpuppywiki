import { Input, Label, TextField } from "react-aria-components";
import { MAX_NAME_LENGTH, UNTITLED_NAME } from "../saves/savedLoadouts";
import styles from "./NameField.module.css";

export interface NameFieldProps {
  value: string;
  onChange: (name: string) => void;
}

export function NameField({ value, onChange }: NameFieldProps) {
  return (
    <TextField value={value} onChange={onChange} maxLength={MAX_NAME_LENGTH} className={styles.field}>
      <Label className={styles.label}>Loadout name</Label>
      <Input className={styles.input} placeholder={UNTITLED_NAME} />
    </TextField>
  );
}
