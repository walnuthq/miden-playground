import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compiledMetadata } from "./package-metadata.ts";

const storage = {
  slots: [
    {
      name: "counter_contract::count_map",
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
describe("compiledMetadata", () => {
  it("keeps the schemas the package has, whatever the build", () => {
    assert.deepEqual(compiledMetadata({ storage }, {}), { storage });
    assert.deepEqual(compiledMetadata({ noteStorage }, {}), { noteStorage });
  });

  it("takes no schema from the build", () => {
    // A MASM build reports none: an older answer's are ignored too.
    const build = { storage, noteStorage } as unknown as Parameters<
      typeof compiledMetadata
    >[1];
    assert.equal(compiledMetadata(null, build), null);
  });

  it("is null when there's nothing to keep", () => {
    assert.equal(compiledMetadata(null, {}), null);
    assert.equal(compiledMetadata({}, {}), null);
  });

  it("takes a script's account procedures from the build, an empty list included", () => {
    assert.deepEqual(compiledMetadata(null, { accountProcedures }), {
      accountProcedures,
    });
    // The script calls no account procedure: every account can run it.
    assert.deepEqual(compiledMetadata(null, { accountProcedures: [] }), {
      accountProcedures: [],
    });
  });

  it("replaces the account procedures of the last build", () => {
    // A failed build reports none: the last build's described other code.
    assert.equal(compiledMetadata({ accountProcedures }, {}), null);
    assert.deepEqual(
      compiledMetadata({ accountProcedures }, { accountProcedures: [] }),
      { accountProcedures: [] },
    );
  });

  it("drops account procedures api-compile couldn't tell", () => {
    assert.equal(compiledMetadata(null, { accountProcedures: null }), null);
    assert.deepEqual(
      compiledMetadata({ noteStorage }, { accountProcedures: null }),
      { noteStorage },
    );
  });

  it("keeps every key together", () => {
    assert.deepEqual(
      compiledMetadata({ storage, noteStorage }, { accountProcedures }),
      { storage, noteStorage, accountProcedures },
    );
  });
});
