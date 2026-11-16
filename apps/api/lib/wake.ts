import type { Context } from "hono";
import type { AppEnv } from "@/lib/app";
import { fetchApiCompile } from "./upstream.ts";

// api-compile runs in a Cloudflare Container that sleeps after 5 minutes
// without requests, and its first compile after a sleep waits for the
// container to start. Its `GET /` is a cheap health route that wakes it.

// How long one wake covers, per Worker isolate: requests in between answer
// without calling api-compile. A client calling the route in a loop sends at
// most one request per interval and isolate to api-compile, and the route
// isn't counted against the compile rate limit.
export const WAKE_INTERVAL_MS = 60_000;

// A container start takes a few seconds; past this, give up. The Worker keeps
// running a `waitUntil` task up to 30 s after its response.
export const WAKE_TIMEOUT_MS = 25_000;

// Answers 204 at once, and wakes api-compile after the response. Its outcome is
// never reported: a failed, slow or unreachable api-compile (local development
// without it on localhost:8080) is ignored.
export const createWakeHandler = ({
  intervalMs = WAKE_INTERVAL_MS,
  timeoutMs = WAKE_TIMEOUT_MS,
  now = Date.now,
} = {}) => {
  let lastWakeAt = Number.NEGATIVE_INFINITY;
  return (c: Context<AppEnv>) => {
    const time = now();
    if (time - lastWakeAt >= intervalMs) {
      lastWakeAt = time;
      c.executionCtx.waitUntil(
        fetchApiCompile("/", { signal: AbortSignal.timeout(timeoutMs) }).then(
          () => undefined,
          () => undefined,
        ),
      );
    }
    return c.body(null, 204);
  };
};
