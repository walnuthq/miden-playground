import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { StorageItem } from "../types/account.ts";
import defaultScripts from "../types/default-scripts/index.ts";
import type { Script } from "../types/script.ts";
import {
  authComponents,
  componentStorageSlots,
  componentTitle,
  deployableAccountComponents,
  isBuiltInScript,
} from "./account-components.ts";
import { defaultScript } from "./script.ts";

const script = (overrides: Partial<Script>): Script => ({
  ...defaultScript(),
  status: "compiled",
  masp: "AAAA",
  ...overrides,
});

const counter = script({ id: "c", name: "counter-account" });
const draft = script({ id: "d", name: "draft", status: "draft", masp: "" });
const failed = script({ id: "e", name: "failed", status: "error" });
const auth = script({
  id: "a",
  name: "my-auth",
  type: "authentication-component",
});
const note = script({ id: "n", name: "note", type: "note" });
const scripts = [...defaultScripts, counter, draft, failed, auth, note];

describe("account components", () => {
  test("the built-ins, the retired counter's copy included", () => {
    assert.equal(isBuiltInScript({ id: "basic-wallet" }), true);
    assert.equal(isBuiltInScript({ id: "counter-contract" }), true);
    assert.equal(isBuiltInScript(counter), false);
  });

  test("built-ins have titles, the rest their names", () => {
    assert.equal(componentTitle({ id: "auth-no-auth", name: "x" }), "No Auth");
    assert.equal(
      componentTitle({ id: "basic-wallet", name: "x" }),
      "Basic Wallet",
    );
    assert.equal(componentTitle(counter), "counter-account");
  });

  test("deploys the user's compiled account components", () => {
    assert.deepEqual(
      deployableAccountComponents(scripts).map(({ id }) => id),
      ["c"],
    );
  });

  test("offers the built-in auth components, then the user's", () => {
    assert.deepEqual(
      authComponents(scripts).map(({ id }) => id),
      [
        "auth-no-auth",
        "auth-single-sig",
        "auth-guarded-multisig",
        "auth-network-account",
        "a",
      ],
    );
  });

  test("a component's slots: its schema's, else its package's prefix", () => {
    const storage: StorageItem[] = [
      {
        name: "counter_account::counter_contract::count_map",
        type: "map",
        item: "",
        mapEntries: [],
      },
      {
        name: "miden::standards::auth::singlesig::pub_key",
        type: "value",
        item: "",
        mapEntries: [],
      },
    ];
    assert.deepEqual(componentStorageSlots(counter, storage), [
      { name: "counter_account::counter_contract::count_map", type: "map" },
    ]);
    assert.deepEqual(
      componentStorageSlots(
        {
          name: "counter-account",
          metadata: {
            storage: {
              slots: [{ name: "x::y::z", type: "value", valueType: "word" }],
            },
          },
        },
        storage,
      ),
      [{ name: "x::y::z", type: "value" }],
    );
    assert.deepEqual(
      componentStorageSlots({ name: "other", metadata: null }, storage),
      [],
    );
  });
});
