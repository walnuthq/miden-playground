import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { counterAccountScript } from "./counter-account.ts";

// Read as a file: count-reader.ts imports modules that need Vite's
// `import.meta.env`, which plain node doesn't have. Its dependency is
// `counterAccountScript`'s id, name and commitment, imported, not copied.
const source = readFileSync(
  new URL("./count-reader.ts", import.meta.url),
  "utf8",
);
const masp = source.match(/\bmasp: "([^"]+)"/)?.[1] ?? "";

// The digests the package's manifest gives a dependency: after its name, a
// tag byte and its version (each string is its length, then its bytes), its
// 32-byte digest. Read from the bytes, as latin1 so one char is one byte.
const manifestDigests = (masp: string, name: string) => {
  const bytes = Buffer.from(masp, "base64");
  const pattern = new RegExp(`${name}[\\s\\S]{2}\\d+\\.\\d+\\.\\d+`, "g");
  return [...bytes.toString("latin1").matchAll(pattern)].map(
    ({ index, 0: match }) => {
      const digestStart = index + match.length;
      return `0x${bytes.subarray(digestStart, digestStart + 32).toString("hex")}`;
    },
  );
};

describe("the embedded count-reader package", () => {
  test("depends on the embedded counter-account, as compiled", () => {
    assert.match(source, /commitment: counterAccountScript\.commitment,/);
    assert.deepEqual(manifestDigests(masp, counterAccountScript.name), [
      counterAccountScript.commitment,
    ]);
  });
});
