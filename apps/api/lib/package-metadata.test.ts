import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { packageMetadata } from "./package-metadata.ts";

const storage = {
  slots: [
    {
      name: "counter_contract::counter_contract::count_map",
      type: "map" as const,
      keyType: "word",
      valueType: "felt",
    },
  ],
};
const accountProcedures = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
];
const noteStorage = {
  name: "p2id-note",
  fields: [{ name: "target-account-id", type: "account-id", width: 2 }],
};

describe("packageMetadata", () => {
  it("keeps the schemas the build reported", () => {
    assert.deepEqual(packageMetadata({ storage }), { storage });
    assert.deepEqual(packageMetadata({ noteStorage }), { noteStorage });
  });

  it("is null when the build reported none", () => {
    // A transaction script, or an api-compile older than the schemas.
    assert.equal(packageMetadata({}), null);
    assert.equal(
      packageMetadata({ storage: undefined, noteStorage: undefined }),
      null,
    );
  });

  it("keeps a script's account procedures, an empty list included", () => {
    assert.deepEqual(packageMetadata({ accountProcedures }), {
      accountProcedures,
    });
    // The script calls no account procedure: every account can run it.
    assert.deepEqual(packageMetadata({ accountProcedures: [] }), {
      accountProcedures: [],
    });
  });

  it("drops account procedures api-compile couldn't tell", () => {
    assert.equal(packageMetadata({ accountProcedures: null }), null);
    assert.deepEqual(
      packageMetadata({ noteStorage, accountProcedures: null }),
      { noteStorage },
    );
  });

  it("keeps every key together", () => {
    assert.deepEqual(
      packageMetadata({ storage, noteStorage, accountProcedures }),
      { storage, noteStorage, accountProcedures },
    );
  });
});
