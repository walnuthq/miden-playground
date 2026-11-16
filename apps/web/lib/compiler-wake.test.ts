import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";
import { createCompilerWake, WAKE_INTERVAL_MS } from "./compiler-wake.ts";

const setup = () => {
  let time = 1_000_000;
  const wake = mock.fn(() => {});
  const compilerWake = createCompilerWake({ wake, now: () => time });
  return {
    wake,
    compilerWake,
    advance: (ms: number) => {
      time += ms;
    },
  };
};

describe("createCompilerWake", () => {
  test("wakes on the first call", () => {
    const { wake, compilerWake } = setup();
    assert.equal(compilerWake.wakeIfIdle(), true);
    assert.equal(wake.mock.callCount(), 1);
  });

  test("wakes at most once per interval", () => {
    const { wake, compilerWake, advance } = setup();
    compilerWake.wakeIfIdle();
    advance(WAKE_INTERVAL_MS - 1);
    assert.equal(compilerWake.wakeIfIdle(), false);
    assert.equal(wake.mock.callCount(), 1);
    advance(1);
    assert.equal(compilerWake.wakeIfIdle(), true);
    assert.equal(wake.mock.callCount(), 2);
  });

  test("a compile counts as a wake", () => {
    const { wake, compilerWake, advance } = setup();
    compilerWake.wakeIfIdle();
    advance(WAKE_INTERVAL_MS - 1_000);
    compilerWake.compiled();
    advance(1_000);
    assert.equal(compilerWake.wakeIfIdle(), false);
    advance(WAKE_INTERVAL_MS - 1_000);
    assert.equal(compilerWake.wakeIfIdle(), true);
    assert.equal(wake.mock.callCount(), 2);
  });

  test("doesn't wake right after a compile", () => {
    const { wake, compilerWake } = setup();
    compilerWake.compiled();
    assert.equal(compilerWake.wakeIfIdle(), false);
    assert.equal(wake.mock.callCount(), 0);
  });
});
