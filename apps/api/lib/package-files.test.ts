import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFiles, exportFiles, ownFiles } from "./package-files.ts";

describe("ownFiles", () => {
  it("keeps only the entries under the package's directory", () => {
    assert.deepEqual(
      ownFiles("a", {
        "a/src/lib.rs": "A",
        "b/src/lib.rs": "B",
        "ab/x": "X",
      }),
      { "a/src/lib.rs": "A" },
    );
  });
});

describe("buildFiles", () => {
  it("puts the package and each dependency's own files side by side", () => {
    assert.deepEqual(
      buildFiles({ "a/src/lib.rs": "A" }, [
        {
          name: "b",
          files: { "b/src/lib.rs": "B", "c/src/lib.rs": "C" },
        },
      ]),
      { "a/src/lib.rs": "A", "b/src/lib.rs": "B" },
    );
  });

  it("does not mutate its arguments", () => {
    const own = { "a/src/lib.rs": "A" };
    const dependencies = [
      { name: "b", files: { "b/src/lib.rs": "B", "c/x": "C" } },
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
          "note/src/lib.rs": "NOTE",
          "note/Cargo.toml": "N",
          "zz-removed/src/lib.rs": "STALE",
          "zz-removed/Cargo.toml": "S",
        },
        [],
      ),
      { "src/lib.rs": "NOTE", "Cargo.toml": "N" },
    );
  });

  it("keeps the directory prefixes when there are dependencies", () => {
    assert.deepEqual(
      exportFiles("note", { "note/src/lib.rs": "NOTE" }, [
        { name: "dep", files: { "dep/src/lib.rs": "DEP" } },
      ]),
      { "note/src/lib.rs": "NOTE", "dep/src/lib.rs": "DEP" },
    );
  });
});
