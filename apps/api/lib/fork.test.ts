import assert from "node:assert/strict";
import { test } from "node:test";
import { forkPackageForest, forkPackages } from "./fork.ts";
import { defaultPackage, type Package } from "./types.ts";

const ROOT = "11111111-1111-4111-8111-111111111111";
const DEPENDENCY = "22222222-2222-4222-8222-222222222222";
const DEEP = "33333333-3333-4333-8333-333333333333";
const DELETED = "44444444-4444-4444-8444-444444444444";

const dbPackage = (fields: Partial<Package>): Package => ({
  ...defaultPackage(),
  readOnly: false,
  ...fields,
});

const builtIns = {
  "basic-wallet": {
    id: "basic-wallet",
    name: "basic-wallet",
    type: "account-component" as const,
    commitment: "0xba51c",
  },
};

const sequentialIds = () => {
  let count = 0;
  return () => `new-${++count}`;
};

test("forkPackages copies a package under a new id, with its owner", () => {
  const root = dbPackage({
    id: ROOT,
    name: "counter",
    files: { "counter/src/lib.rs": "source" },
    masm: "masm",
    masp: "masp",
    commitment: "0xc0",
    status: "compiled",
  });
  const { id, copies } = forkPackages({
    rootId: ROOT,
    packages: [root],
    builtIns,
    newId: sequentialIds(),
    ownerKeyHash: "hash",
  });
  assert.equal(id, "new-1");
  assert.deepEqual(copies, [
    {
      row: {
        id: "new-1",
        name: "counter",
        type: "account-component",
        status: "compiled",
        files: { "counter/src/lib.rs": "source" },
        masm: "masm",
        commitment: "0xc0",
        masp: "masp",
        exports: [],
        metadata: null,
        dependencies: [],
        ownerKeyHash: "hash",
      },
      dependencies: [],
    },
  ]);
});

test("forkPackages points the copies at each other", () => {
  const { id, copies } = forkPackages({
    rootId: ROOT,
    packages: [
      dbPackage({ id: DEEP, name: "deep", commitment: "0xd" }),
      dbPackage({
        id: ROOT,
        name: "note",
        type: "note",
        dependencies: [DEPENDENCY, "basic-wallet"],
      }),
      dbPackage({
        id: DEPENDENCY,
        name: "counter",
        commitment: "0xc",
        dependencies: [DEEP],
      }),
    ],
    builtIns,
    newId: sequentialIds(),
    ownerKeyHash: "hash",
  });
  assert.equal(id, "new-2");
  const [deep, root, dependency] = copies;
  assert.deepEqual(deep?.row.dependencies, []);
  assert.deepEqual(dependency?.row.dependencies, ["new-1"]);
  assert.deepEqual(dependency?.dependencies, [
    { id: "new-1", name: "deep", type: "account-component", commitment: "0xd" },
  ]);
  // A built-in dependency keeps its id.
  assert.deepEqual(root?.row.dependencies, ["new-3", "basic-wallet"]);
  assert.deepEqual(root?.dependencies, [
    {
      id: "new-3",
      name: "counter",
      type: "account-component",
      commitment: "0xc",
    },
    builtIns["basic-wallet"],
  ]);
  assert.equal(root?.row.ownerKeyHash, "hash");
});

test("forkPackages drops a dependency that is gone", () => {
  const { copies } = forkPackages({
    rootId: ROOT,
    packages: [
      dbPackage({ id: ROOT, dependencies: [DELETED, "not-a-built-in"] }),
    ],
    builtIns,
    newId: sequentialIds(),
    ownerKeyHash: "hash",
  });
  assert.deepEqual(copies[0]?.row.dependencies, []);
  assert.deepEqual(copies[0]?.dependencies, []);
});

const SECOND_ROOT = "55555555-5555-4555-8555-555555555555";

test("forkPackageForest copies a dependency two roots share once", () => {
  const { ids, copies } = forkPackageForest({
    packages: [
      dbPackage({
        id: ROOT,
        name: "deposit",
        type: "note",
        dependencies: [DEPENDENCY],
      }),
      dbPackage({
        id: SECOND_ROOT,
        name: "withdraw",
        type: "note",
        dependencies: [DEPENDENCY, "basic-wallet"],
      }),
      dbPackage({ id: DEPENDENCY, name: "bank-account", commitment: "0xb" }),
    ],
    builtIns,
    newId: sequentialIds(),
    ownerKeyHash: "hash",
  });
  assert.equal(copies.length, 3);
  assert.deepEqual(Object.fromEntries(ids), {
    [ROOT]: "new-1",
    [SECOND_ROOT]: "new-2",
    [DEPENDENCY]: "new-3",
  });
  const [deposit, withdraw] = copies;
  // Both notes point at the same copy of the account.
  assert.deepEqual(deposit?.row.dependencies, ["new-3"]);
  assert.deepEqual(withdraw?.row.dependencies, ["new-3", "basic-wallet"]);
  assert.ok(copies.every(({ row }) => row.ownerKeyHash === "hash"));
});

test("forkPackageForest copies a root that another root depends on once", () => {
  const { ids, copies } = forkPackageForest({
    packages: [
      dbPackage({
        id: ROOT,
        name: "note",
        type: "note",
        dependencies: [DEPENDENCY],
      }),
      dbPackage({ id: DEPENDENCY, name: "counter" }),
    ],
    builtIns,
    newId: sequentialIds(),
    ownerKeyHash: "hash",
  });
  assert.equal(copies.length, 2);
  assert.equal(ids.get(DEPENDENCY), "new-2");
  assert.deepEqual(copies[0]?.row.dependencies, ["new-2"]);
});
