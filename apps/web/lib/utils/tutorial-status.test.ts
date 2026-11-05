import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { tutorialStatus } from "./tutorial-status.ts";

const state = {
  tutorialId: "transfer-assets-between-wallets" as const,
  tutorialStep: 2,
  tutorialMaxStep: 3,
  tutorialProgress: {
    "create-and-fund-wallet": { step: 4, maxStep: 5, savedAt: 1 },
  },
};

describe("tutorialStatus", () => {
  test("the active tutorial: its live step", () => {
    assert.deepEqual(tutorialStatus(state, "transfer-assets-between-wallets"), {
      step: 2,
      maxStep: 3,
      active: true,
    });
  });

  test("a tutorial left unfinished: its saved progress", () => {
    assert.deepEqual(tutorialStatus(state, "create-and-fund-wallet"), {
      step: 4,
      maxStep: 5,
      active: false,
    });
  });

  test("a tutorial never started, or no tutorial: null", () => {
    assert.equal(tutorialStatus(state, "private-transfers"), null);
    assert.equal(tutorialStatus({ ...state, tutorialId: "" }, ""), null);
  });
});
