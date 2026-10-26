import { QueryClient } from "@tanstack/react-query";
import { DataMissingError, DataValidationError } from "./fetchJson";

const MAX_RETRIES = 1;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(error instanceof DataMissingError || error instanceof DataValidationError) && failureCount < MAX_RETRIES,
      },
    },
  });
}
