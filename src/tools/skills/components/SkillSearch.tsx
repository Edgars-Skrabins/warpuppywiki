import type { Skill } from "@/core/data";
import { ComboBox } from "@/ui";
import type { SearchEntry } from "../logic/skillSearch";
import { skillLabel } from "../logic/treeLayout";

export interface SkillSearchProps {
  entries: readonly SearchEntry[];
  selectedId: string | null;
  onSelect: (skill: Skill) => void;
  className?: string;
}

export function SkillSearch({ entries, selectedId, onSelect, className }: SkillSearchProps) {
  return (
    <ComboBox
      label="Search skills"
      items={entries}
      getKey={(entry) => entry.skill.id}
      getLabel={(entry) => skillLabel(entry.skill)}
      getSearchText={(entry) => entry.text}
      getGroup={(entry) => entry.roleLabel}
      selectedKey={selectedId}
      onSelectionChange={(_, entry) => {
        if (entry) {
          onSelect(entry.skill);
        }
      }}
      placeholder="Name or description, any role"
      emptyText="No skill matches"
      className={className}
    />
  );
}
