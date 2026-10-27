import { Badge, Button, EmptyState, ErrorState, LoadingState, Panel } from "@/ui";
import type { CategoryResult } from "../hooks/useCategoryDiff";
import { isRecoilPatternChange } from "../diff/summarize";
import { ChangeTable } from "./ChangeTable";
import styles from "./EntityDetail.module.css";
import { STATUS_BADGES } from "./statusBadges";
import { RecoilChangePlot } from "./RecoilChangePlot";

export interface EntityDetailProps {
  result: CategoryResult;
  entityKey: string;
  onBack: () => void;
}

function DetailBody({ result, entityKey }: Omit<EntityDetailProps, "onBack">) {
  if (result.status === "loading") {
    return <LoadingState label={`Comparing ${result.definition.label.toLowerCase()}`} />;
  }
  if (result.status === "error") {
    return <ErrorState title={`Couldn't compare ${result.definition.label.toLowerCase()}`} details={result.errors} />;
  }
  const entity = result.diff.entities.find((candidate) => candidate.key === entityKey);
  if (!entity) {
    return <EmptyState title="No changes" text="This entry didn't change between these builds." />;
  }
  const badge = STATUS_BADGES[entity.status];
  const recoil = entity.changes.find(isRecoilPatternChange);
  return (
    <div className={styles.body}>
      <div className={styles.heading}>
        <h3 className={styles.name}>{entity.name}</h3>
        <span className={styles.category}>{result.definition.label}</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      {recoil && <RecoilChangePlot before={recoil.before} after={recoil.after} />}
      <ChangeTable categoryId={result.definition.id} entity={entity} />
    </div>
  );
}

export function EntityDetail({ onBack, ...props }: EntityDetailProps) {
  return (
    <Panel
      title={props.result.definition.label}
      actions={
        <Button variant="ghost" size="sm" onPress={onBack}>
          Back to {props.result.definition.label.toLowerCase()}
        </Button>
      }
    >
      <DetailBody {...props} />
    </Panel>
  );
}
