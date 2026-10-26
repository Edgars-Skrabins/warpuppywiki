import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
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

export function DataProvider({ client, children }: { client?: QueryClient; children: ReactNode }) {
  const [queryClient] = useState(() => client ?? createQueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
