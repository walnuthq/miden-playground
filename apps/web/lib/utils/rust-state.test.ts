import assert from "node:assert/strict";
import { describe, test } from "node:test";
import defaultScripts from "../types/default-scripts/index.ts";
import {
  holdsRustScript,
  isRustScript,
  persistedWorkspace,
  resettingWorkspace,
  takeWorkspaceReset,
} from "./rust-state.ts";
import { defaultState, stateSerializer } from "./state.ts";

const userScript = (id: string, files: Record<string, string>) => ({
  id,
  name: id,
  type: "account-component",
  status: "compiled",
  readOnly: false,
  files,
  masp: "",
  commitment: "0x1",
  exports: [],
  dependencies: [],
  createdAt: "",
  updatedAt: "",
});

const rustScript = userScript("my-counter", {
  "src/lib.rs": "#![no_std]",
  "Cargo.toml": '[package]\nname = "my-counter"',
});
const masmScript = userScript("my-counter", {
  "my_counter.masm": "pub proc get_count\n  push.0\nend",
  "miden-project.toml": '[package]\nname = "my-counter"',
});

// A persisted state as stateSerializer writes it, with these scripts next to
// the built-ins and the other fields given.
const persisted = (scripts: object[], overrides: Partial<object> = {}) => {
  const value = JSON.parse(stateSerializer(defaultState()));
  return JSON.stringify({
    ...value,
    scripts: [...value.scripts, ...scripts],
    ...overrides,
  });
};

const account = { id: "0xa", name: "Counter", components: ["my-counter"] };

describe("isRustScript", () => {
  test("a Rust source or a Cargo.toml", () => {
    assert.equal(isRustScript(rustScript), true);
    assert.equal(
      isRustScript(userScript("a", { "src/lib.rs": "#![no_std]" })),
      true,
    );
    assert.equal(isRustScript(userScript("a", { "Cargo.toml": "" })), true);
    assert.equal(
      isRustScript(userScript("a", { "nested/Cargo.toml": "" })),
      true,
    );
  });

  test("the legacy `rust` field of scripts persisted before `files`", () => {
    assert.equal(isRustScript({ id: "a", rust: "#![no_std]" }), true);
    assert.equal(isRustScript({ id: "a", rust: "" }), false);
  });

  test("a MASM script, or one with no files", () => {
    assert.equal(isRustScript(masmScript), false);
    assert.equal(isRustScript(userScript("a", {})), false);
    assert.equal(isRustScript({ id: "a" }), false);
  });

  test("never a built-in, retired ones included", () => {
    for (const id of [
      ...defaultScripts.map(({ id }) => id),
      "counter-contract",
    ]) {
      assert.equal(isRustScript(userScript(id, { "src/lib.rs": "" })), false);
    }
  });
});

describe("holdsRustScript", () => {
  test("a sandbox's state", () => {
    assert.equal(holdsRustScript(persisted([rustScript])), true);
    assert.equal(holdsRustScript(persisted([masmScript])), false);
    assert.equal(holdsRustScript(persisted([])), false);
  });

  test("a saved project's state, among MASM scripts", () => {
    assert.equal(
      holdsRustScript(
        persisted([masmScript, { ...rustScript, id: "bank" }], {
          projectId: "p",
          projectName: "Bank",
          exampleId: "bank-account",
          accounts: [account],
        }),
      ),
      true,
    );
    assert.equal(
      holdsRustScript(
        persisted([masmScript], { projectId: "p", accounts: [account] }),
      ),
      false,
    );
  });

  test("a tutorial's saved progress, with an embedded Rust package", () => {
    const tutorial = {
      tutorialId: "foreign-procedure-invocation",
      tutorialStep: 3,
      tutorialMaxStep: 3,
    };
    assert.equal(
      holdsRustScript(
        persisted(
          [{ ...rustScript, id: "count-reader", readOnly: true }],
          tutorial,
        ),
      ),
      true,
    );
    assert.equal(
      holdsRustScript(
        persisted([], { ...tutorial, tutorialId: "private-transfers" }),
      ),
      false,
    );
  });

  test("a state that doesn't parse, or has no scripts", () => {
    assert.equal(holdsRustScript("{"), false);
    assert.equal(holdsRustScript("{}"), false);
    assert.equal(holdsRustScript('{"scripts":[null,1]}'), false);
  });
});

describe("persistedWorkspace", () => {
  test("no persisted state: the default one, no reset", () => {
    takeWorkspaceReset();
    assert.deepEqual(persistedWorkspace(null).scripts, defaultState().scripts);
    assert.equal(takeWorkspaceReset(), false);
  });

  test("a state without a Rust script is read as it was", () => {
    takeWorkspaceReset();
    const state = persistedWorkspace(
      persisted([masmScript], { accounts: [account], projectName: "Mine" }),
    );
    assert.equal(state.projectName, "Mine");
    assert.deepEqual(state.accounts, [account]);
    assert.ok(state.scripts.some(({ id }) => id === "my-counter"));
    assert.equal(takeWorkspaceReset(), false);
  });

  test("a state with a Rust script is reset whole, keeping the tutorials", () => {
    takeWorkspaceReset();
    const progress = {
      "private-transfers": { step: 2, maxStep: 3, savedAt: 1 },
    };
    const state = persistedWorkspace(
      persisted([masmScript, rustScript], {
        accounts: [account],
        transactions: [{ id: "0xt" }],
        inputNotes: [{ id: "0xn" }],
        exampleId: "counter-account",
        projectId: "p",
        projectName: "Mine",
        tutorialId: "interact-with-the-counter-contract",
        completedTutorials: ["create-and-fund-wallet"],
        tutorialProgress: progress,
      }),
    );
    assert.deepEqual(state.scripts, defaultState().scripts);
    assert.deepEqual(state.accounts, []);
    assert.deepEqual(state.transactions, []);
    assert.deepEqual(state.inputNotes, []);
    assert.equal(state.exampleId, "");
    assert.equal(state.projectId, "");
    assert.equal(state.tutorialId, "");
    assert.deepEqual([...state.completedTutorials], ["create-and-fund-wallet"]);
    assert.deepEqual(state.tutorialProgress, progress);
    // Queued once for the SDK side, which builds the new sandbox.
    assert.equal(takeWorkspaceReset(), true);
    assert.equal(takeWorkspaceReset(), false);
    // Not persisted until the new sandbox is switched to.
    assert.equal(resettingWorkspace(0), true);
    assert.equal(resettingWorkspace(1), false);
  });
});
