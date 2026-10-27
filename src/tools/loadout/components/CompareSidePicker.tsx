import { useState } from "react";
import { Input, Label, TextField } from "react-aria-components";
import type { UrlStateCodec } from "@/core/state";
import { Button, Select } from "@/ui";
import { parsePastedLink, type ResolvedSide, type SideSource } from "../compare/sideSource";
import type { Loadout } from "../model/loadout";
import { displayName, type SavedEntry } from "../saves/savedLoadouts";
import styles from "./Compare.module.css";

const PASTE_KEY = "paste";
const LINK_KEY = "link";

interface SideChoice {
  key: string;
  label: string;
  source: SideSource | null;
}

function choiceKey(source: SideSource): string {
  if (source.kind === "saved") return `saved:${source.id}`;
  return source.kind;
}

export interface CompareSidePickerProps {
  side: "A" | "B";
  source: SideSource;
  resolved: ResolvedSide;
  entries: readonly SavedEntry[];
  codec: UrlStateCodec<Loadout>;
  onChange: (source: SideSource) => void;
  onEdit: () => void;
}

export function CompareSidePicker({
  side,
  source,
  resolved,
  entries,
  codec,
  onChange,
  onEdit,
}: CompareSidePickerProps) {
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [invalid, setInvalid] = useState(false);
  const choices: SideChoice[] = [
    { key: "current", label: "Current loadout", source: { kind: "current" } },
    { key: "empty", label: "Empty loadout", source: { kind: "empty" } },
    ...entries.flatMap((entry): SideChoice[] =>
      entry.kind === "saved"
        ? [
            {
              key: `saved:${entry.saved.id}`,
              label: displayName(entry.saved.name),
              source: { kind: "saved", id: entry.saved.id },
            },
          ]
        : [],
    ),
    ...(source.kind === "link" ? [{ key: LINK_KEY, label: "Pasted link", source }] : []),
    { key: PASTE_KEY, label: "Paste link…", source: null },
  ];
  const applyPasted = () => {
    const next = parsePastedLink(pasted, codec);
    if (next === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setPasting(false);
    setPasted("");
    onChange(next);
  };

  return (
    <section className={styles.side} aria-label={`Side ${side}`}>
      <div className={styles.sideHeader}>
        <span className={styles.sideTag}>{side}</span>
        <p className={styles.sideLabel}>{resolved.label}</p>
        <Button size="sm" variant="ghost" onPress={onEdit} isDisabled={!resolved.ok}>
          Edit {side}
        </Button>
      </div>
      <Select
        label={`Loadout ${side}`}
        items={choices}
        getKey={(choice) => choice.key}
        getLabel={(choice) => choice.label}
        selectedKey={pasting ? PASTE_KEY : source.kind === "link" ? LINK_KEY : choiceKey(source)}
        onSelectionChange={(_key, choice) => {
          if (choice === null) return;
          if (choice.source === null) {
            setPasting(true);
            return;
          }
          setPasting(false);
          setInvalid(false);
          onChange(choice.source);
        }}
      />
      {pasting && (
        <div className={styles.paste}>
          <TextField value={pasted} onChange={setPasted} className={styles.pasteField} isInvalid={invalid}>
            <Label className={styles.label}>Loadout link {side}</Label>
            <Input
              className={styles.input}
              placeholder="https://…/#/loadout?l=…"
              onKeyDown={(event) => {
                if (event.key === "Enter") applyPasted();
              }}
            />
          </TextField>
          <Button size="sm" onPress={applyPasted}>
            Use link
          </Button>
        </div>
      )}
      {(invalid || (!resolved.ok && source.kind === "link")) && (
        <p className={styles.error} role="alert">
          That link isn&apos;t a loadout link
        </p>
      )}
    </section>
  );
}
