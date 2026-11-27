import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Dependency, Script } from "../types/script.ts";
import {
  foreignDependencies,
  missingBuiltInDependencies,
  SIMULATED_PREFIX,
  simulatedAccountName,
  simulatedAccountValue,
} from "./foreign-accounts.ts";

const script = (fields: Partial<Script>): Script => ({
  id: "",
  name: "",
  type: "account-component",
  status: "compiled",
  readOnly: false,
  files: {},
  masm: "",
  error: "",
  warnings: "",
  commitment: "",
  masp: "TUFTUA",
  exports: [],
  procedureExports: [],
  dependencies: [],
  createdAt: 0,
  updatedAt: 0,
  ...fields,
});

const counter: Dependency = {
  id: "counter-account",
  name: "counter-account",
  type: "account-component",
  commitment: "0xc0",
};

const reader = (...dependencies: Dependency[]) => ({ dependencies });

describe("foreignDependencies", () => {
  test("resolves to the workspace script of the same id first", () => {
    const sameId = script({ id: "counter-account", commitment: "0xc0" });
    const other = script({ id: "copy", commitment: "0xc0" });
    assert.deepEqual(
      foreignDependencies(reader(counter), [other, sameId], []),
      [{ dependency: counter, script: sameId }],
    );
  });

  test("then to any workspace script with the same commitment", () => {
    // The API's built-in id, not the workspace script's.
    const copy = script({ id: "random-id", commitment: "0xc0" });
    assert.deepEqual(foreignDependencies(reader(counter), [copy], []), [
      { dependency: counter, script: copy },
    ]);
  });

  test("skips a workspace script without a package", () => {
    const draft = script({
      id: "counter-account",
      commitment: "0xc0",
      masp: "",
    });
    assert.deepEqual(foreignDependencies(reader(counter), [draft], []), [
      { dependency: counter, reason: "stale" },
    ]);
  });

  test("a recompiled dependency is stale", () => {
    const recompiled = script({ id: "counter-account", commitment: "0xc1" });
    assert.deepEqual(foreignDependencies(reader(counter), [recompiled], []), [
      { dependency: counter, reason: "stale" },
    ]);
  });

  test("an unknown package is missing", () => {
    assert.deepEqual(foreignDependencies(reader(counter), [], []), [
      { dependency: counter, reason: "missing" },
    ]);
  });

  test("ignores the dependencies that aren't account components", () => {
    const library: Dependency = {
      id: "lib",
      name: "lib",
      type: "library",
      commitment: "0xc0",
    };
    const copy = script({ id: "lib", commitment: "0xc0" });
    assert.deepEqual(foreignDependencies(reader(library), [copy], []), []);
  });

  test("then to a built-in dependency's package from the API", () => {
    const builtIn = script({ id: "counter-account", commitment: "0xc0" });
    assert.deepEqual(foreignDependencies(reader(counter), [], [builtIn]), [
      { dependency: counter, script: builtIn },
    ]);
    // The workspace's script comes first.
    const copy = script({ id: "random-id", commitment: "0xc0" });
    assert.deepEqual(foreignDependencies(reader(counter), [copy], [builtIn]), [
      { dependency: counter, script: copy },
    ]);
    // The template changed since the script was compiled: another package.
    const rebuilt = script({ id: "counter-account", commitment: "0xc1" });
    assert.deepEqual(foreignDependencies(reader(counter), [], [rebuilt]), [
      { dependency: counter, reason: "missing" },
    ]);
  });
});

describe("missingBuiltInDependencies", () => {
  test("names the built-in dependencies the workspace doesn't hold", () => {
    assert.deepEqual(missingBuiltInDependencies(reader(counter), []), [
      "counter-account",
    ]);
  });

  test("names none the workspace resolves, or holds recompiled", () => {
    const copy = script({ id: "random-id", commitment: "0xc0" });
    assert.deepEqual(missingBuiltInDependencies(reader(counter), [copy]), []);
    const recompiled = script({ id: "counter-account", commitment: "0xc1" });
    assert.deepEqual(
      missingBuiltInDependencies(reader(counter), [recompiled]),
      [],
    );
  });

  test("names no dependency that isn't built in", () => {
    const own: Dependency = { ...counter, id: "5f0c", name: "my-counter" };
    const wallet: Dependency = {
      ...counter,
      id: "basic-wallet",
      name: "basic-wallet",
    };
    assert.deepEqual(missingBuiltInDependencies(reader(own, wallet), []), []);
  });
});

describe("simulated account stand-in", () => {
  test("round-trips a dependency's name", () => {
    const value = simulatedAccountValue("counter-account");
    assert.equal(value, `${SIMULATED_PREFIX}counter-account`);
    assert.equal(simulatedAccountName(value), "counter-account");
  });

  test("isn't an account id", () => {
    assert.equal(
      simulatedAccountName("0x4e6fb40fd2f6a55140df2c42dfb5b7"),
      undefined,
    );
    assert.equal(simulatedAccountName(""), undefined);
  });

  test("isn't a simulated asset's stand-in", () => {
    assert.equal(simulatedAccountName("simulated:asset:SIM"), undefined);
  });
});
