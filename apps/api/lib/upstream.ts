import { NextResponse } from "next/server";
import { API_COMPILE_URL, API_REGISTRY_URL } from "@/lib/constants";

// A failed call to api-compile or api-registry, with the status it answered.
// When it could not be reached, or did not answer with JSON, the status is 502.
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfter?: string,
  ) {
    super(message);
  }
}

const fetchUpstream = async <T>(
  service: string,
  url: string,
  init?: RequestInit,
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    // Let a request aborted by the client fail as such.
    if (init?.signal?.aborted) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new UpstreamError(`${service} is unreachable: ${message}`, 502);
  }
  // Error pages from Cloudflare or the container runtime are not JSON.
  const data = (await response.json().catch(() => undefined)) as
    { error?: string } | undefined;
  if (!response.ok) {
    throw new UpstreamError(
      data?.error ?? `${service} responded ${response.status}`,
      response.status,
      response.headers.get("Retry-After") ?? undefined,
    );
  }
  if (data === undefined) {
    throw new UpstreamError(`${service} answered with invalid JSON`, 502);
  }
  return data as T;
};

export const fetchApiCompile = <T>(path: string, init?: RequestInit) =>
  fetchUpstream<T>("api-compile", `${API_COMPILE_URL}${path}`, init);

export const fetchApiRegistry = <T>(path: string, init?: RequestInit) =>
  fetchUpstream<T>("api-registry", `${API_REGISTRY_URL}${path}`, init);

// When an upstream service was unreachable (502), busy (503) or too slow (504),
// answer with the same status and its `Retry-After`, so a client can tell a
// temporary outage from a failed compilation or verification.
export const upstreamErrorResponse = (error: unknown) => {
  if (
    !(error instanceof UpstreamError) ||
    error.status < 502 ||
    error.status > 504
  ) {
    return undefined;
  }
  return new NextResponse(error.message, {
    status: error.status,
    headers: error.retryAfter ? { "Retry-After": error.retryAfter } : {},
  });
};
