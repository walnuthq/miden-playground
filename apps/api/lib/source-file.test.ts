import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  masmNamespace,
  scriptFilePaths,
  sourceFilePath,
} from "./source-file.ts";

describe("source file", () => {
  test("is named after the package, with `-` as `_`", () => {
    assert.equal(sourceFilePath("counter-account"), "counter_account.masm");
    assert.equal(sourceFilePath("P2ID_note2"), "P2ID_note2.masm");
    assert.equal(masmNamespace("my-counter-2"), "my_counter_2");
  });
  test("sits next to the manifest", () => {
    assert.deepEqual(scriptFilePaths("counter-note"), [
      "counter_note.masm",
      "miden-project.toml",
    ]);
  });
});
