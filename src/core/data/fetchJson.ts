export class DataMissingError extends Error {
  readonly kind = "missing";

  constructor(readonly url: string) {
    super(`Game data file not found: ${url}`);
    this.name = "DataMissingError";
  }
}

export class DataNetworkError extends Error {
  readonly kind = "network";

  constructor(
    readonly url: string,
    readonly status?: number,
  ) {
    super(status === undefined ? `Could not load ${url}` : `Could not load ${url} (HTTP ${status})`);
    this.name = "DataNetworkError";
  }
}

export class DataValidationError extends Error {
  readonly kind = "validation";

  constructor(
    readonly url: string,
    readonly issues: string[],
  ) {
    super(`Unexpected data format in ${url}`);
    this.name = "DataValidationError";
  }
}

export type DataError = DataMissingError | DataNetworkError | DataValidationError;

export function isDataError(error: unknown): error is DataError {
  return error instanceof DataMissingError || error instanceof DataNetworkError || error instanceof DataValidationError;
}

export async function fetchJson(url: string): Promise<unknown> {
  let response: Response;
  let text: string;
  try {
    response = await fetch(url);
  } catch {
    throw new DataNetworkError(url);
  }
  if (response.status === 404 || response.headers.get("Content-Type")?.startsWith("text/html")) {
    throw new DataMissingError(url);
  }
  if (!response.ok) {
    throw new DataNetworkError(url, response.status);
  }
  try {
    text = await response.text();
  } catch {
    throw new DataNetworkError(url, response.status);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new DataValidationError(url, ["not valid JSON"]);
  }
}
