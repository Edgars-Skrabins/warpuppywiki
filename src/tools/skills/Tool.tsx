import { useMemo } from "react";
import { sameId, useCatalog, type Catalog } from "@/core/catalog";
import { useGameData, type DataState, type SkillsFile } from "@/core/data";
import { DataStateView } from "@/ui";
import { RoleTabs } from "./components/RoleTabs";
import { SkillPanel } from "./components/SkillPanel";
import { SkillSearch } from "./components/SkillSearch";
import { SkillTree } from "./components/SkillTree";
import { UnplacedSkills } from "./components/UnplacedSkills";
import { searchEntries } from "./logic/skillSearch";
import { treeLayout, unplacedSkills } from "./logic/treeLayout";
import { orderedRoles, useSkillsSelection } from "./state";
import styles from "./Tool.module.css";

export const POSITIONS_NOTE =
  "Skill point costs and prerequisites aren't in the game files, so the tree shows positions only.";

export const NO_TREE_NOTE = "The game files place none of this role's skills in the tree.";

interface SkillsData {
  skills: SkillsFile;
  catalog: Catalog;
}

function combine(skills: DataState<SkillsFile>, catalog: DataState<Catalog>): DataState<SkillsData> {
  if (skills.status !== "success") {
    return skills;
  }
  if (catalog.status !== "success") {
    return catalog;
  }
  return { status: "success", data: { skills: skills.data, catalog: catalog.data } };
}

function SkillTrees({ skills, catalog }: SkillsData) {
  const selection = useSkillsSelection();
  const roles = useMemo(() => orderedRoles(skills.trees, skills.skills), [skills.trees, skills.skills]);
  const role = roles.find((candidate) => sameId(candidate, selection.role)) ?? roles[0] ?? selection.role;
  const roleSkills = useMemo(() => skills.skills.filter((skill) => sameId(skill.role, role)), [skills.skills, role]);
  const layout = useMemo(() => treeLayout(roleSkills), [roleSkills]);
  const unplaced = useMemo(() => unplacedSkills(roleSkills), [roleSkills]);
  const entries = useMemo(
    () => searchEntries(skills.skills, roles, (id) => catalog.roleLabel(id)),
    [skills.skills, roles, catalog],
  );
  const selected =
    selection.skillId === null ? null : (roleSkills.find((skill) => sameId(skill.id, selection.skillId ?? "")) ?? null);
  const selectedId = selected?.id ?? null;
  const label = catalog.roleLabel(role);

  return (
    <div className={styles.tool}>
      <SkillSearch
        entries={entries}
        selectedId={selectedId}
        onSelect={selection.selectSkill}
        className={styles.search}
      />
      <RoleTabs roles={roles} selected={role} roleLabel={(id) => catalog.roleLabel(id)} onSelect={selection.selectRole}>
        <div className={styles.layout}>
          <div className={styles.treeColumn}>
            {layout.nodes.length === 0 ? (
              <p className={styles.note}>{NO_TREE_NOTE}</p>
            ) : (
              <SkillTree
                layout={layout}
                label={`${label} skill tree`}
                selectedId={selectedId}
                onSelect={(id) => {
                  const skill = roleSkills.find((candidate) => candidate.id === id);
                  if (skill) {
                    selection.selectSkill(skill);
                  }
                }}
              />
            )}
            <UnplacedSkills skills={unplaced} selectedId={selectedId} onSelect={selection.selectSkill} />
            <p className={styles.note}>{POSITIONS_NOTE}</p>
          </div>
          <aside className={styles.panelColumn}>
            <SkillPanel skill={selected} roleLabel={label} />
          </aside>
        </div>
      </RoleTabs>
    </div>
  );
}

export default function Tool() {
  const skills = useGameData("skills");
  const catalog = useCatalog();
  return (
    <DataStateView state={combine(skills, catalog)} emptyWhen={(data) => data.skills.skills.length === 0}>
      {(data) => <SkillTrees skills={data.skills} catalog={data.catalog} />}
    </DataStateView>
  );
}
