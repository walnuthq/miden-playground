import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isPackageSource,
  isStringArray,
  isValidNetwork,
  isValidPackageName,
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
