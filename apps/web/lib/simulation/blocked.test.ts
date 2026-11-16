import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  FOREIGN_CALL_REASON,
  missingForeignCallReason,
  simulationBlockedReason,
  staleForeignCallReason,
} from "./blocked.ts";

describe("simulationBlockedReason", () => {
  test("blocks a foreign call when no account could be staged", () => {
    assert.equal(
      simulationBlockedReason({ callsForeign: true }),
      FOREIGN_CALL_REASON,
    );
    assert.equal(
      simulationBlockedReason({ callsForeign: true }, { staged: 0 }),
      FOREIGN_CALL_REASON,
    );
  });

  test("says which dependency must be compiled again", () => {
    assert.equal(
      simulationBlockedReason(
        { callsForeign: true },
        { staged: 0, stale: ["counter-account"], missing: ["other"] },
      ),
      staleForeignCallReason(["counter-account"]),
    );
    assert.equal(
      simulationBlockedReason(
        { callsForeign: true },
        { staged: 0, missing: ["other"] },
      ),
      missingForeignCallReason(["other"]),
    );
  });

  test("asks a read-only script for no compile", () => {
    const stale = simulationBlockedReason(
      { callsForeign: true },
      { staged: 0, stale: ["counter-account"] },
      true,
    );
    assert.equal(stale, staleForeignCallReason(["counter-account"], true));
    assert.doesNotMatch(stale ?? "", /compile this/);
    const missing = simulationBlockedReason(
      { callsForeign: true },
      { staged: 0, missing: ["counter-account"] },
      true,
    );
    assert.equal(missing, missingForeignCallReason(["counter-account"], true));
    assert.doesNotMatch(missing ?? "", /compile it/);
  });

  test("runs a foreign call against a staged account", () => {
    assert.equal(
      simulationBlockedReason(
        { callsForeign: true },
        { staged: 1, stale: ["other"] },
      ),
      undefined,
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
