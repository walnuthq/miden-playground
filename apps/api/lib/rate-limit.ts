import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/lib/app";

// Who a request is counted against: the client's address as Cloudflare
// reports it. Without it (local `wrangler dev`, the e2e runs), nothing is
// limited.
export const rateLimitKey = (headers: Headers) =>
  headers.get("cf-connecting-ip") ?? undefined;

// Refuses a request with 429 once its client is over the limit declared by the
// COMPILE_RATE_LIMITER binding in wrangler.jsonc.
export const rateLimit = createMiddleware<AppEnv>(async (c, next) => {
  const key = rateLimitKey(c.req.raw.headers);
  const limiter = c.env.COMPILE_RATE_LIMITER;
  if (key === undefined || !limiter) {
    return next();
  }
  const { success } = await limiter.limit({ key });
  if (!success) {
    return c.text("Error: Too many requests. Try again in a minute.", 429, {
      "Retry-After": "60",
    });
  }
  return next();
});
