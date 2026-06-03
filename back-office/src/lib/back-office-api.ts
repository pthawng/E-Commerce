const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CORRELATION_ID_HEADER = "x-correlation-id";

function createCorrelationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `bo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class BackOfficeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly correlationId: string | null,
    public readonly errorClass?: string | null,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "BackOfficeApiError";
  }
}

export function getDisplayError(error: unknown) {
  if (error instanceof BackOfficeApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      correlationId: error.correlationId,
      errorClass: error.errorClass ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: null,
      correlationId: null,
      errorClass: null,
    };
  }

  return {
    message: "Unexpected back-office error",
    statusCode: null,
    correlationId: null,
    errorClass: null,
  };
}

export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function backOfficeFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (!headers.has(CORRELATION_ID_HEADER)) {
    headers.set(CORRELATION_ID_HEADER, createCorrelationId());
  }

  if (!CSRF_SAFE_METHODS.has(method)) {
    const csrfToken = getCookie("csrfToken");
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
}

export async function backOfficeJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await backOfficeFetch(input, init);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new BackOfficeApiError(
      body?.message ?? body?.error ?? "Back-office API request failed",
      res.status,
      body?.meta?.correlationId ?? res.headers.get(CORRELATION_ID_HEADER),
      body?.meta?.errorClass ?? body?.errorClass ?? null,
      body?.errors ?? body,
    );
  }

  return (body?.data ?? body) as T;
}
