import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { storageSlotName } from "../utils/component.ts";
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

  test("names its parameters as the WIT it embeds does", () => {
    // The WIT is in the package as text (its `wit` section):
    // `copy-count: func(counter-account-id: account-id)`. The function is
    // the export path's last segment.
    const wit = Buffer.from(masp, "base64").toString("latin1");
    const exports = [
      ...source.matchAll(
        /path: '[^']*::"?([a-z0-9-]+)"?',[\s\S]*?parameters: (\[[^\]]*\])/g,
      ),
    ];
    assert.equal(exports.length, 1);
    for (const [, name, parameters] of exports) {
      const list = [
        ...(parameters ?? "").matchAll(/name: "([^"]+)", type: "([^"]+)"/g),
      ]
        .map(([, name, type]) => `${name}: ${type}`)
        .join(", ");
      assert.ok(wit.includes(`${name}: func(${list})`), `${name}(${list})`);
    }
  });

  test("embeds the storage schema api-compile returned", () => {
    // Compiled from apps/api/templates/count-reader.rs through the local
    // API (2026-11-18): one value slot, named as the compiler derives it.
    const metadata = source.match(/\bmetadata: (\{[\s\S]*?\n {2}\}),\n/)?.[1];
    assert.ok(metadata, "metadata");
    const slots = [
      ...metadata.matchAll(
        /name: "([^"]+)",\s*description: "([^"]+)",\s*type: "([^"]+)",\s*valueType: "([^"]+)",/g,
      ),
    ].map(([, name, description, type, valueType]) => ({
      name,
      description,
      type,
      valueType,
    }));
    assert.deepEqual(slots, [
      {
        name: storageSlotName({
          packageName: "count-reader",
          traitName: "CountReader",
          fieldName: "count",
        }),
        description: "count reader storage value",
        type: "value",
        valueType: "felt",
      },
    ]);
    // The source declares that slot, with that description.
    assert.match(
      source,
      /#\[storage\(description = "count reader storage value"\)\]\s*count: StorageValue<Felt>,/,
    );
  });
});
