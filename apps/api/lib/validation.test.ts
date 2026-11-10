import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isBoundedArray,
  isId,
  isPackageSource,
  isPackageSources,
  isSource,
  isStringArray,
  isValidNetwork,
  isValidPackageName,
  MAX_ID_LENGTH,
  MAX_MANIFEST_LENGTH,
  MAX_PACKAGES,
  MAX_SOURCE_LENGTH,
} from "./validation.ts";

test("package names", () => {
  for (const name of ["ab", "counter-note", "My_Lib2"]) {
    assert.equal(isValidPackageName(name), true, name);
  }
  for (const name of [
    "a",
    "",
    "2ab",
    "a/b",
    "../x",
    'a"b',
    "a b",
    "a".repeat(65),
    undefined,
    42,
  ]) {
    assert.equal(isValidPackageName(name), false, String(name));
  }
});

test("networks", () => {
  for (const network of ["mtst", "mm"]) {
    assert.equal(isValidNetwork(network), true, network);
  }
  for (const network of ["", "../x", "a/b", "MTST"]) {
    assert.equal(isValidNetwork(network), false, network);
  }
});

test("string arrays", () => {
  assert.equal(isStringArray([]), true);
  assert.equal(isStringArray(["a"]), true);
  for (const value of ["a", [1], undefined]) {
    assert.equal(isStringArray(value), false);
  }
});

test("package sources", () => {
  assert.equal(isPackageSource({ midenProjectToml: "", rust: "x" }), true);
  for (const value of [
    null,
    {},
    { rust: "x" },
    { rust: 1, midenProjectToml: "" },
  ]) {
    assert.equal(isPackageSource(value), false);
  }
});

const pkg = { midenProjectToml: "", rust: "" };

test("source length", () => {
  assert.equal(isSource("a".repeat(MAX_SOURCE_LENGTH)), true);
  assert.equal(isSource("a".repeat(MAX_SOURCE_LENGTH + 1)), false);
  assert.equal(isSource(1), false);
});

test("ids", () => {
  assert.equal(isId("a".repeat(MAX_ID_LENGTH)), true);
  for (const value of ["", "a".repeat(MAX_ID_LENGTH + 1), 1]) {
    assert.equal(isId(value), false);
  }
});

test("bounded arrays", () => {
  assert.equal(isBoundedArray(Array(MAX_PACKAGES).fill(0)), true);
  assert.equal(isBoundedArray(Array(MAX_PACKAGES + 1).fill(0)), false);
  assert.equal(isBoundedArray({}), false);
});

test("package source limits", () => {
  assert.equal(isPackageSource(pkg), true);
  assert.equal(
    isPackageSource({ ...pkg, rust: "a".repeat(MAX_SOURCE_LENGTH + 1) }),
    false,
  );
  assert.equal(
    isPackageSource({
      ...pkg,
      midenProjectToml: "a".repeat(MAX_MANIFEST_LENGTH + 1),
    }),
    false,
  );
});

test("import package sources", () => {
  const entries = (count: number) =>
    Object.fromEntries(Array.from({ length: count }, (_, i) => [`p${i}`, pkg]));
  assert.equal(isPackageSources(entries(MAX_PACKAGES)), true);
  assert.equal(isPackageSources(entries(MAX_PACKAGES + 1)), false);
  assert.equal(isPackageSources(null), false);
  assert.equal(isPackageSources([pkg]), false);
  assert.equal(
    isPackageSources({ ["a".repeat(MAX_ID_LENGTH + 1)]: pkg }),
    false,
  );
  assert.equal(isPackageSources({ a: pkg, b: { rust: "" } }), false);
});
