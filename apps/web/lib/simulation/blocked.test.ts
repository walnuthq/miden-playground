import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { FOREIGN_CALL_REASON, simulationBlockedReason } from "./blocked.ts";

describe("simulationBlockedReason", () => {
  test("blocks a procedure that calls another account's procedure", () => {
    assert.equal(
      simulationBlockedReason({ callsForeign: true }),
      FOREIGN_CALL_REASON,
    );
  });

  test("lets every other procedure run", () => {
    assert.equal(simulationBlockedReason({ callsForeign: false }), undefined);
    // api-compile couldn't tell.
    assert.equal(simulationBlockedReason({ callsForeign: null }), undefined);
    // A built-in, a registry package, a package compiled before the flag.
    assert.equal(simulationBlockedReason({}), undefined);
  });
});
