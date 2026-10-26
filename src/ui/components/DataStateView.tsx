import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { DataMissingError, DataValidationError, type DataError, type DataState } from "@/core/data";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

export interface DataStateViewProps<T> {
  state: DataState<T>;
  children: (data: T) => ReactNode;
  loading?: ReactNode;
  emptyWhen?: (data: T) => boolean;
}

function DataErrorView({ error }: { error: DataError }) {
  const queryClient = useQueryClient();
  if (error instanceof DataMissingError) {
    return (
      <ErrorState
        title="Game data is missing"
        text={
          import.meta.env.DEV ? (
            <>
              Run <code>pnpm data:sync</code>.
            </>
          ) : undefined
        }
      />
    );
  }
  if (error instanceof DataValidationError) {
    return <ErrorState title="Game data has an unexpected format" text={error.message} details={error.issues} />;
  }
  return (
    <ErrorState
      title="Could not load game data"
      text={error.message}
      onRetry={() => void queryClient.invalidateQueries({ predicate: (query) => query.state.status === "error" })}
    />
  );
}

export function DataStateView<T>({ state, children, loading, emptyWhen }: DataStateViewProps<T>) {
  if (state.status === "loading") {
    return loading ?? <LoadingState />;
  }
  if (state.status === "error") {
    return <DataErrorView error={state.error} />;
  }
  if (emptyWhen?.(state.data)) {
    return <EmptyState title="Nothing to show" />;
  }
  return children(state.data);
}
