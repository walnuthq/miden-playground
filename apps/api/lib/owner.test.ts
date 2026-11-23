import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hashOwnerToken,
  isWritable,
  ownerToken,
  writeAccess,
} from "./owner.ts";

const token = "a".repeat(64);
const otherToken = "b".repeat(64);

test("ownerToken reads a bearer token", () => {
  assert.equal(ownerToken(`Bearer ${token}`), token);
  assert.equal(ownerToken(`bearer ${token}`), token);
  assert.equal(ownerToken(`  Bearer   ${token} `), token);
});

test("ownerToken is undefined without a header", () => {
  assert.equal(ownerToken(undefined), undefined);
  assert.equal(ownerToken(null), undefined);
});

test("ownerToken refuses anything else", () => {
  for (const header of [
    "",
    "Bearer",
    "Bearer short",
    `Basic ${token}`,
    `Bearer ${token} extra`,
    `Bearer ${"a".repeat(129)}`,
    `Bearer ${"é".repeat(64)}`,
    token,
  ]) {
    assert.equal(ownerToken(header), null, header);
  }
});

test("hashOwnerToken is the token's SHA-256 in hex", async () => {
  assert.equal(
    await hashOwnerToken("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.notEqual(
    await hashOwnerToken(token),
    await hashOwnerToken(otherToken),
  );
});

test("writeAccess: a package with an owner", async () => {
  const ownerKeyHash = await hashOwnerToken(token);
  assert.equal(writeAccess({ ownerKeyHash, tokenHash: ownerKeyHash }), "allow");
  assert.equal(
    writeAccess({ ownerKeyHash, tokenHash: await hashOwnerToken(otherToken) }),
    "deny",
  );
  assert.equal(writeAccess({ ownerKeyHash, tokenHash: undefined }), "deny");
  // A hash of another length never matches.
  assert.equal(writeAccess({ ownerKeyHash, tokenHash: "" }), "deny");
  assert.equal(
    writeAccess({ ownerKeyHash, tokenHash: ownerKeyHash.slice(1) }),
    "deny",
  );
});

test("writeAccess: a package without an owner", async () => {
  assert.equal(
    writeAccess({ ownerKeyHash: null, tokenHash: await hashOwnerToken(token) }),
    "claim",
  );
  assert.equal(
    writeAccess({ ownerKeyHash: null, tokenHash: undefined }),
    "deny",
  );
});

test("isWritable is false for another owner's package and without a token", async () => {
  const ownerKeyHash = await hashOwnerToken(token);
  const otherHash = await hashOwnerToken(otherToken);
  assert.equal(isWritable({ ownerKeyHash, tokenHash: ownerKeyHash }), true);
  assert.equal(isWritable({ ownerKeyHash: null, tokenHash: otherHash }), true);
  assert.equal(isWritable({ ownerKeyHash: null, tokenHash: undefined }), false);
  assert.equal(isWritable({ ownerKeyHash, tokenHash: otherHash }), false);
  assert.equal(isWritable({ ownerKeyHash, tokenHash: undefined }), false);
});
