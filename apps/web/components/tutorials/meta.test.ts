import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { nextTutorialMeta, tutorialMetas } from "./meta.ts";

describe("nextTutorialMeta", () => {
  const metas = tutorialMetas.slice(0, 4).map((meta, index) => ({
    ...meta,
    unavailable: index === 2 ? "Temporarily unavailable." : undefined,
  }));

  test("the tutorial that follows", () => {
    assert.equal(nextTutorialMeta(1, metas)?.number, 2);
  });

  test("skips a tutorial that is unavailable", () => {
    assert.equal(nextTutorialMeta(2, metas)?.number, 4);
  });

  test("none after the last one", () => {
    assert.equal(nextTutorialMeta(4, metas), undefined);
  });

  test("as shipped: 5 is skipped, and 11 leads to 12", () => {
    assert.equal(nextTutorialMeta(4)?.number, 6);
    assert.equal(nextTutorialMeta(11)?.id, "contract-verification");
    assert.equal(nextTutorialMeta(12), undefined);
  });

  test("the tutorials are numbered in order, as it assumes", () => {
    assert.deepEqual(
      tutorialMetas.map(({ number }) => number),
      tutorialMetas.map((_, index) => index + 1),
    );
  });
});
