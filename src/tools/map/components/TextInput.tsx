import { useId, type InputHTMLAttributes } from "react";
import styles from "./TextInput.module.css";

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string | null;
}

export function TextInput({ label, error = null, ...props }: TextInputProps) {
  const id = useId();
  const errorId = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        className={styles.input}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? errorId : undefined}
      />
      {error !== null && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
