import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Script } from "../../../lib/types/script.ts";
import { notReady } from "./not-ready.ts";

const script = (fields: Pick<Script, "status" | "masp" | "readOnly">) =>
  fields as Script;

describe("notReady", () => {
  test("a compiled package is ready, read-only or not", () => {
    for (const readOnly of [false, true]) {
      assert.equal(
        notReady(script({ status: "compiled", masp: "TUFTUA==", readOnly })),
        undefined,
      );
    }
  });

  test("a draft, a failed compile or no package isn't", () => {
    assert.match(
      notReady(script({ status: "draft", masp: "", readOnly: false })) ?? "",
      /source changed/,
    );
    assert.match(
      notReady(script({ status: "error", masp: "", readOnly: false })) ?? "",
      /compile errors/,
    );
    assert.match(
      notReady(script({ status: "compiled", masp: "", readOnly: false })) ?? "",
      /^Compile the script/,
    );
  });
});
