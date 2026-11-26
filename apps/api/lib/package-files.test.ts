import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFiles, exportFiles, ownFiles } from "./package-files.ts";

describe("ownFiles", () => {
  it("keeps only the entries under the package's directory", () => {
    assert.deepEqual(
      ownFiles("a", {
        "a/a.masm": "A",
        "b/b.masm": "B",
        "ab/x": "X",
      }),
      { "a/a.masm": "A" },
    );
  });
});

describe("buildFiles", () => {
  it("puts the package and each dependency's own files side by side", () => {
    assert.deepEqual(
      buildFiles({ "a/a.masm": "A" }, [
        {
          name: "b",
          files: { "b/b.masm": "B", "c/c.masm": "C" },
        },
      ]),
      { "a/a.masm": "A", "b/b.masm": "B" },
    );
  });

  it("does not mutate its arguments", () => {
    const own = { "a/a.masm": "A" };
    const dependencies = [
      { name: "b", files: { "b/b.masm": "B", "c/x": "C" } },
    ];
    const ownBefore = structuredClone(own);
    const dependenciesBefore = structuredClone(dependencies);
    buildFiles(own, dependencies);
    assert.deepEqual(own, ownBefore);
    assert.deepEqual(dependencies, dependenciesBefore);
  });
});

describe("exportFiles", () => {
  it("ignores stale foreign directories of a package without dependencies", () => {
    assert.deepEqual(
      exportFiles(
        "note",
        {
          "note/note.masm": "NOTE",
          "note/miden-project.toml": "N",
          "zz-removed/zz_removed.masm": "STALE",
          "zz-removed/miden-project.toml": "S",
        },
        [],
      ),
      { "note.masm": "NOTE", "miden-project.toml": "N" },
    );
  });

  it("keeps the directory prefixes when there are dependencies", () => {
    assert.deepEqual(
      exportFiles("note", { "note/note.masm": "NOTE" }, [
        { name: "dep", files: { "dep/dep.masm": "DEP" } },
      ]),
      { "note/note.masm": "NOTE", "dep/dep.masm": "DEP" },
    );
  });
});
