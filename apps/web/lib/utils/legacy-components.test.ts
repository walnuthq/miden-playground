import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { PackageMetadata } from "../types/script.ts";
import { migrateLegacyComponents } from "./legacy-components.ts";
import { stateDeserializer, stateSerializer } from "./state.ts";
import { wordTextToHex } from "./storage-slots.ts";

const script = (id: string, metadata?: PackageMetadata | null) => ({
  id,
  name: id,
  type: "account-component",
  status: "compiled",
  readOnly: false,
  files: {},
  masm: "",
  error: "",
  warnings: "",
  commitment: "",
  masp: "",
  exports: [],
  procedureExports: [],
  dependencies: [],
  ...(metadata !== undefined && { metadata }),
  createdAt: 0,
  updatedAt: 0,
});

const account = (id: string, components: string[]) => ({ id, components });

const component = (
  id: string,
  scriptId: string,
  storageSlots: { name: string; type: "value" | "map"; value: string }[] = [],
) => ({
  id,
  name: id,
  type: "account-component" as const,
  scriptId,
  storageSlots,
  updatedAt: 0,
});

const builtIns = [
  component("auth-no-auth", "auth-no-auth"),
  component("basic-wallet", "basic-wallet"),
];

const CUSTOM_ID = "my-counter_8a3f1c2e-0000-4000-8000-000000000000";
const API_ID = "0b6f4d2a-1111-4111-8111-111111111111";

// The parsed JSON, as `stateDeserializer` migrates it.
const migrate = (value: string) =>
  migrateLegacyComponents(
    JSON.parse(value) as Parameters<typeof migrateLegacyComponents>[0],
  );

const legacyState = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    accounts: [account("0x1", ["basic-wallet", "auth-no-auth", CUSTOM_ID])],
    scripts: [script("my-counter-script")],
    components: [
      ...builtIns,
      component(CUSTOM_ID, "my-counter-script", [
        {
          name: "my_counter::counter_contract::count_map",
          type: "map",
          value: "1:0",
        },
        {
          name: "my_counter::counter_contract::owner",
          type: "value",
          value: "7",
        },
        {
          name: "my_counter::counter_contract::zero",
          type: "value",
          value: "0",
        },
      ]),
    ],
    ...extra,
  });

describe("migrating legacy components", () => {
  test("turns a custom component into its script", () => {
    const state = migrate(legacyState());
    assert.deepEqual(state.accounts?.[0]?.components, [
      "basic-wallet",
      "auth-no-auth",
      "my-counter-script",
    ]);
    const migrated = state.scripts?.find(
      ({ id }) => id === "my-counter-script",
    );
    assert.deepEqual(migrated?.metadata, {
      storage: {
        slots: [
          {
            name: "my_counter::counter_contract::count_map",
            type: "map",
            keyType: "word",
            valueType: "word",
          },
          {
            name: "my_counter::counter_contract::owner",
            type: "value",
            valueType: "word",
            defaultValue: wordTextToHex("7"),
          },
          {
            name: "my_counter::counter_contract::zero",
            type: "value",
            valueType: "word",
          },
        ],
      },
    });
    assert.equal("components" in state, false);
  });

  test("maps an example's component to its API script", () => {
    const state = migrate(
      JSON.stringify({
        accounts: [
          account("0x2", ["basic-wallet", "auth-no-auth", "counter-account"]),
        ],
        scripts: [
          script(API_ID, {
            storage: { slots: [] },
            accountProcedures: null,
          }),
        ],
        components: [
          ...builtIns,
          component("counter-account", API_ID, [
            {
              name: "counter_account::counter_contract::count_map",
              type: "map",
              value: "1:0",
            },
          ]),
        ],
      }),
    );
    assert.deepEqual(state.accounts?.[0]?.components, [
      "basic-wallet",
      "auth-no-auth",
      API_ID,
    ]);
    // A script that has a schema keeps it.
    assert.deepEqual(state.scripts?.find(({ id }) => id === API_ID)?.metadata, {
      storage: { slots: [] },
      accountProcedures: null,
    });
  });

  test("keeps other metadata next to the schema it adds", () => {
    const { scripts } = migrateLegacyComponents({
      scripts: [script(API_ID, { accountProcedures: [] })],
      components: [
        component("c", API_ID, [{ name: "a::b::c", type: "value", value: "" }]),
      ],
    });
    assert.deepEqual(scripts?.[0]?.metadata, {
      accountProcedures: [],
      storage: {
        slots: [{ name: "a::b::c", type: "value", valueType: "word" }],
      },
    });
  });

  test("leaves a retired built-in's copy and unknown ids alone", () => {
    const state = migrate(
      JSON.stringify({
        accounts: [
          account("0x3", ["basic-wallet", "counter-contract", "gone"]),
        ],
        scripts: [script("counter-contract")],
        components: [
          ...builtIns,
          component("counter-contract", "counter-contract", [
            { name: "x::y::z", type: "value", value: "1" },
          ]),
        ],
      }),
    );
    assert.deepEqual(state.accounts?.[0]?.components, [
      "basic-wallet",
      "counter-contract",
      "gone",
    ]);
    assert.equal(
      state.scripts?.find(({ id }) => id === "counter-contract")?.metadata,
      undefined,
    );
  });

  test("the first component of a script gives its schema", () => {
    const { scripts, accounts } = migrateLegacyComponents({
      accounts: [account("0x4", ["one", "two"])],
      scripts: [script("s")],
      components: [
        component("one", "s", [
          { name: "a::b::first", type: "value", value: "1" },
        ]),
        component("two", "s", [
          { name: "a::b::second", type: "value", value: "2" },
        ]),
      ],
    });
    assert.deepEqual(
      scripts?.[0]?.metadata?.storage?.slots.map(({ name }) => name),
      ["a::b::first"],
    );
    assert.deepEqual(accounts?.[0]?.components, ["s"]);
  });

  test("leaves a state without components as it is", () => {
    const value = {
      accounts: [account("0x5", ["basic-wallet", "s"])],
      scripts: [script("s")],
      tutorialId: "deploy-a-counter-contract",
      tutorialStep: 5,
      tutorialMaxStep: 5,
    };
    assert.deepEqual(migrateLegacyComponents(value), value);
  });

  test("shifts tutorial 7's steps", () => {
    const steps = (step: number, maxStep: number) => {
      const state = migrate(
        legacyState({
          tutorialId: "deploy-a-counter-contract",
          tutorialStep: step,
          tutorialMaxStep: maxStep,
          tutorialProgress: {
            "deploy-a-counter-contract": { step, maxStep, savedAt: 1 },
            "foreign-procedure-invocation": { step: 4, maxStep: 4, savedAt: 1 },
          },
        }),
      );
      return [
        state.tutorialStep,
        state.tutorialMaxStep,
        state.tutorialProgress?.["deploy-a-counter-contract"]?.step,
        state.tutorialProgress?.["deploy-a-counter-contract"]?.maxStep,
        state.tutorialProgress?.["foreign-procedure-invocation"]?.step,
      ];
    };
    assert.deepEqual(steps(1, 2), [1, 2, 1, 2, 4]);
    // Both old steps land on the new one.
    assert.deepEqual(steps(2, 3), [2, 2, 2, 2, 4]);
    assert.deepEqual(steps(3, 3), [2, 2, 2, 2, 4]);
    assert.deepEqual(steps(6, 6), [5, 5, 5, 5, 4]);
  });

  test("another tutorial's steps stay", () => {
    const state = migrate(
      legacyState({
        tutorialId: "foreign-procedure-invocation",
        tutorialStep: 4,
        tutorialMaxStep: 5,
      }),
    );
    assert.equal(state.tutorialStep, 4);
    assert.equal(state.tutorialMaxStep, 5);
  });

  test("running it twice changes nothing more", () => {
    const once = migrate(
      legacyState({
        tutorialId: "deploy-a-counter-contract",
        tutorialStep: 4,
        tutorialMaxStep: 4,
      }),
    );
    assert.equal(once.tutorialStep, 3);
    const twice = migrateLegacyComponents(once);
    assert.deepEqual(twice, once);
  });

  test("stateDeserializer migrates once, and the serializer drops the key", () => {
    const once = stateDeserializer(
      legacyState({
        tutorialId: "deploy-a-counter-contract",
        tutorialStep: 4,
        tutorialMaxStep: 4,
      }),
    );
    assert.equal(once.tutorialStep, 3);
    assert.deepEqual(once.accounts[0]?.components, [
      "basic-wallet",
      "auth-no-auth",
      "my-counter-script",
    ]);
    const serialized = stateSerializer(once);
    assert.equal("components" in JSON.parse(serialized), false);
    const twice = stateDeserializer(serialized);
    assert.equal(twice.tutorialStep, 3);
    assert.deepEqual(twice.accounts, once.accounts);
    assert.deepEqual(
      twice.scripts.find(({ id }) => id === "my-counter-script")?.metadata,
      once.scripts.find(({ id }) => id === "my-counter-script")?.metadata,
    );
  });
});
