import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { newOwnerToken, ownerHeaders, ownerToken } from "./owner-token.ts";

// A localStorage stand-in: `fail` makes it refuse writes, as a full quota or
// a private window does.
const store = new Map<string, string>();
let fail = false;
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (fail) {
        throw new Error("QuotaExceededError");
      }
      store.set(key, value);
    },
  },
});

beforeEach(() => {
  store.clear();
  fail = false;
});

test("newOwnerToken is 32 random bytes in hex", () => {
  assert.match(newOwnerToken(), /^[0-9a-f]{64}$/);
  assert.notEqual(newOwnerToken(), newOwnerToken());
});

test("ownerToken is created once and kept", () => {
  const token = ownerToken();
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(store.get("owner-token"), token);
  assert.equal(ownerToken(), token);
  assert.deepEqual(ownerHeaders(), { Authorization: `Bearer ${token}` });
});

test("ownerToken follows the stored token (another tab's)", () => {
  const other = "c".repeat(64);
  store.set("owner-token", other);
  assert.equal(ownerToken(), other);
});

test("ownerToken replaces a stored value that isn't a token", () => {
  store.set("owner-token", "not a token");
  const token = ownerToken();
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(store.get("owner-token"), token);
});

test("ownerToken lasts the page's life when it can't be stored", () => {
  fail = true;
  const token = ownerToken();
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(store.has("owner-token"), false);
  assert.equal(ownerToken(), token);
});
