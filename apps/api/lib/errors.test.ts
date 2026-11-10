import assert from "node:assert/strict";
import { test } from "node:test";
import { badRequest, errorStatusAndMessage, notFound } from "./errors.ts";
import { isAlreadyVerified, UpstreamError } from "./upstream.ts";

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

test("an upstream client error keeps its status and message", () => {
  for (const status of [400, 404, 409]) {
    assert.deepEqual(
      errorStatusAndMessage(new UpstreamError("bad manifest", status)),
      { status, message: "bad manifest" },
    );
  }
});

test("any other upstream error is a 500 with its message", () => {
  for (const status of [401, 403, 429, 500]) {
    assert.deepEqual(
      errorStatusAndMessage(new UpstreamError("refused", status)),
      { status: 500, message: "refused" },
    );
  }
});

test("only a 409 from upstream means already verified", () => {
  assert.equal(isAlreadyVerified(new UpstreamError("…", 409)), true);
  assert.equal(isAlreadyVerified(new UpstreamError("…", 400)), false);
  assert.equal(isAlreadyVerified(new Error("409")), false);
});
