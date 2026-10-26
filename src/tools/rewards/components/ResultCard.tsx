import { useState } from "react";
import { Button, Card, CardBody, CardHeader, formatCash, formatNumber } from "@/ui";
import { formatFormula } from "../formula/format";
import type { ResourceResult } from "../model/calculate";
import { isCash, resourceLabel } from "../model/contextTags";
import { CurveChart } from "./CurveChart";
import styles from "./ResultCard.module.css";
import { WorkingTable } from "./WorkingTable";

function amountText(resource: string, amount: number): string {
  const rounded = Math.round(amount);
  return isCash(resource) ? formatCash(rounded) : `${formatNumber(rounded)} XP`;
}

export function ResultCard({ result }: { result: ResourceResult }) {
  const [showWorking, setShowWorking] = useState(false);
  const label = resourceLabel(result.resource);

  return (
    <Card className={styles.card}>
      <CardHeader
        title={label}
        subtitle={result.resource}
        actions={
          <Button variant="ghost" size="sm" aria-expanded={showWorking} onPress={() => setShowWorking((on) => !on)}>
            {showWorking ? "Hide working" : "Show working"}
          </Button>
        }
      />
      <CardBody className={styles.body}>
        {result.error === null && result.amount !== null ? (
          <output className={styles.amount} aria-label={`${label} amount`}>
            {amountText(result.resource, result.amount)}
          </output>
        ) : (
          <p className={styles.error} role="alert">
            This formula couldn&apos;t be evaluated: {result.error}
          </p>
        )}
        {showWorking && (
          <div className={styles.working}>
            <pre className={styles.formula}>{result.expr ? formatFormula(result.expr) : result.formula}</pre>
            <WorkingTable working={result.working} label={`${label} working`} />
            {result.working.map((entry) =>
              entry.curve !== null && entry.value !== null ? (
                <CurveChart key={entry.name} use={entry.curve} value={entry.value} />
              ) : null,
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
