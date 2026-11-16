import assert from "node:assert/strict";
import { afterEach, describe, mock, test } from "node:test";
import { Hono } from "hono";
import { createWakeHandler } from "./wake.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// A fetch that answers only when `answer` or `fail` is called.
const pendingFetch = () => {
  let answer = () => {};
  let fail = (_error: Error) => {};
  const fn = mock.fn(
    () =>
      new Promise<Response>((resolve, reject) => {
        answer = () => resolve(Response.json({ timestamp: 0 }));
        fail = reject;
      }),
  );
  globalThis.fetch = fn as unknown as typeof fetch;
  return { fn, answer: () => answer(), fail: (error: Error) => fail(error) };
};

// Runs the route with an execution context that collects its `waitUntil`
// promises.
const wakeApp = (options?: Parameters<typeof createWakeHandler>[0]) => {
  const app = new Hono().post("/wake", createWakeHandler(options));
  const tasks: Promise<unknown>[] = [];
  const executionCtx = {
    waitUntil: (promise: Promise<unknown>) => {
      tasks.push(promise);
    },
    passThroughOnException: () => {},
    props: {},
  };
  const wake = () => app.request("/wake", { method: "POST" }, {}, executionCtx);
  return { wake, tasks };
};

describe("POST /wake", () => {
  test("answers before api-compile does", async () => {
    const upstream = pendingFetch();
    const { wake, tasks } = wakeApp();
    const response = await wake();
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.equal(upstream.fn.mock.callCount(), 1);
    const [url, init] = (upstream.fn.mock.calls[0]?.arguments ??
      []) as unknown as [string, RequestInit];
    assert.match(url, /\/$/);
    assert.equal(init.method, undefined);
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal(tasks.length, 1);
    upstream.answer();
    assert.equal(await tasks[0], undefined);
  });

  test("swallows an unreachable api-compile", async () => {
    const upstream = pendingFetch();
    const { wake, tasks } = wakeApp();
    const response = await wake();
    assert.equal(response.status, 204);
    upstream.fail(new TypeError("fetch failed"));
    assert.equal(await tasks[0], undefined);
  });

  test("swallows an error answer and a timeout", async () => {
    globalThis.fetch = (async () =>
      new Response("Service Unavailable", { status: 503 })) as typeof fetch;
    const failing = wakeApp();
    assert.equal((await failing.wake()).status, 204);
    assert.equal(await failing.tasks[0], undefined);

    globalThis.fetch = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(init.signal?.reason),
        );
      })) as typeof fetch;
    const slow = wakeApp({ timeoutMs: 10 });
    assert.equal((await slow.wake()).status, 204);
    assert.equal(await slow.tasks[0], undefined);
  });

  test("calls api-compile once per interval", async () => {
    const upstream = pendingFetch();
    let time = 0;
    const { wake } = wakeApp({ intervalMs: 60_000, now: () => time });
    await wake();
    time = 59_999;
    assert.equal((await wake()).status, 204);
    assert.equal(upstream.fn.mock.callCount(), 1);
    time = 60_000;
    await wake();
    assert.equal(upstream.fn.mock.callCount(), 2);
  });
});
