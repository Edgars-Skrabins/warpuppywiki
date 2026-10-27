import { EmptyState } from "@/ui";

export function NothingToCompare() {
  return (
    <EmptyState
      title="Nothing to compare"
      text="Only one game build is available, so there is nothing to compare yet."
    />
  );
}
