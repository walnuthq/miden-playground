import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toDataPoint } from "./analytics-events.ts";

describe("toDataPoint", () => {
  test("keeps the columns in their positions", () => {
    assert.deepEqual(
      toDataPoint({
        name: "complete_tutorial_step",
        route: "/scripts/:id",
        tutorial_id: "create-and-fund-wallet",
        network_id: "mtst",
        wallet_connected: true,
        tutorial_step: 3,
        visit: true,
        automated: false,
      }),
      {
        indexes: ["complete_tutorial_step"],
        blobs: [
          "complete_tutorial_step",
          "/scripts/:id",
          "create-and-fund-wallet",
          "mtst",
          "true",
          "false",
        ],
        doubles: [3, 1],
      },
    );
  });

  test("fills the fields an event doesn't have", () => {
    assert.deepEqual(toDataPoint({ name: "page_view" }), {
      indexes: ["page_view"],
      blobs: ["page_view", "", "", "", "", ""],
      doubles: [0, 0],
    });
  });

  test("accepts the root and catch-all routes and an empty tutorial", () => {
    for (const route of ["/", "/*", "/accounts/:identifier"]) {
      assert.notEqual(toDataPoint({ name: "page_view", route }), null);
    }
    assert.notEqual(
      toDataPoint({ name: "complete_tutorial", tutorial_id: "" }),
      null,
    );
  });

  test("rejects anything that isn't one of our events", () => {
    for (const body of [
      null,
      "page_view",
      [],
      {},
      { name: "unknown" },
      { name: "toString" },
    ]) {
      assert.equal(toDataPoint(body), null);
    }
  });

  test("rejects unknown fields and wrong types", () => {
    for (const fields of [
      { email: "someone@example.com" },
      { toString: "x" },
      { route: "/accounts/<script>" },
      { route: "/a".repeat(51) },
      { tutorial_id: 1 },
      { wallet_connected: "true" },
      { tutorial_step: "1" },
      { tutorial_step: Number.NaN },
      { tutorial_step: Number.POSITIVE_INFINITY },
      { visit: 1 },
      { route: null },
    ]) {
      assert.equal(toDataPoint({ name: "page_view", ...fields }), null);
    }
  });
});
