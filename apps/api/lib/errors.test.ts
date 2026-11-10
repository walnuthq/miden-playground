import assert from "node:assert/strict";
import { test } from "node:test";
import { badRequest, errorStatusAndMessage, notFound } from "./errors.ts";
import { UpstreamError } from "./upstream.ts";

test("client errors keep their status and message", () => {
  assert.deepEqual(errorStatusAndMessage(badRequest("Error: bad.")), {
    status: 400,
    message: "Error: bad.",
  });
  assert.deepEqual(errorStatusAndMessage(notFound("Error: gone.")), {
    status: 404,
    message: "Error: gone.",
  });
});

test("unexpected errors are a generic 500", () => {
  const expected = { status: 500, message: "Error: Internal server error." };
  assert.deepEqual(
    errorStatusAndMessage(new Error("Failed query: select …")),
    expected,
  );
  assert.deepEqual(errorStatusAndMessage("boom"), expected);
});

test("an upstream error keeps its message", () => {
  assert.deepEqual(
    errorStatusAndMessage(new UpstreamError("bad manifest", 400)),
    { status: 500, message: "bad manifest" },
  );
});
