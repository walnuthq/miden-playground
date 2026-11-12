import assert from "node:assert/strict";
import { afterEach, describe, mock, test } from "node:test";
import { fetchRetryingNetworkError } from "./fetch.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const mockFetch = (...results: (Response | Error)[]) => {
  const fn = mock.fn(async () => {
    const result = results.shift();
    if (result instanceof Error) {
      throw result;
    }
    return result as Response;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
};

describe("fetchRetryingNetworkError", () => {
  test("sends the request again after a network error", async () => {
    const fn = mockFetch(
      new TypeError("Failed to fetch"),
      new Response("ok", { status: 200 }),
    );
    const response = await fetchRetryingNetworkError("https://api.test/x", {
      method: "PATCH",
      body: "{}",
    });
    assert.equal(await response.text(), "ok");
    assert.equal(fn.mock.callCount(), 2);
    assert.deepEqual(fn.mock.calls[1]?.arguments, [
      "https://api.test/x",
      { method: "PATCH", body: "{}" },
    ]);
  });

  test("retries only once", async () => {
    const fn = mockFetch(
      new TypeError("Failed to fetch"),
      new TypeError("Failed to fetch"),
    );
    await assert.rejects(
      fetchRetryingNetworkError("https://api.test/x"),
      TypeError,
    );
    assert.equal(fn.mock.callCount(), 2);
  });

  test("returns an HTTP error status without retrying", async () => {
    const fn = mockFetch(new Response("nope", { status: 500 }));
    const response = await fetchRetryingNetworkError("https://api.test/x");
    assert.equal(response.status, 500);
    assert.equal(fn.mock.callCount(), 1);
  });

  test("doesn't retry an aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    const fn = mockFetch(new TypeError("Failed to fetch"));
    await assert.rejects(
      fetchRetryingNetworkError("https://api.test/x", {
        signal: controller.signal,
      }),
      TypeError,
    );
    assert.equal(fn.mock.callCount(), 1);
  });
});
