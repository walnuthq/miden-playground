import assert from "node:assert/strict";
import { test } from "node:test";
import { rateLimitKey } from "./rate-limit.ts";

test("rateLimitKey is the client address Cloudflare reports", () => {
  const headers = new Headers({ "cf-connecting-ip": "203.0.113.7" });
  assert.equal(rateLimitKey(headers), "203.0.113.7");
});

test("rateLimitKey is undefined without the header", () => {
  assert.equal(rateLimitKey(new Headers()), undefined);
});
