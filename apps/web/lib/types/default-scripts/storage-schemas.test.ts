import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { schemaStorageSlots } from "../../utils/storage-schema.ts";
import { wordTextToHex } from "../../utils/storage-slots.ts";
import authGuardedMultisig from "../default-components/auth-guarded-multisig.ts";
import authNetworkAccount from "../default-components/auth-network-account.ts";
import authSingleSig from "../default-components/auth-single-sig.ts";
import fungibleFaucet from "../default-components/fungible-faucet.ts";
import {
  authGuardedMultisigStorage,
  authNetworkAccountStorage,
  authSingleSigStorage,
  fungibleFaucetStorage,
} from "./storage-schemas.ts";

// A slot as a comparable value: a value slot's text as a hex word, so `2` and
// its word compare equal.
const comparable = ({
  name,
  type,
  value,
}: {
  name: string;
  type: string;
  value: string;
}) => ({ name, type, value: type === "value" ? wordTextToHex(value) : value });

// The built-in components go away once accounts are deployed from scripts
// (spec/remove-components.md): until then, each built-in script's schema
// gives the slots its component does, in the same order, at the same values.
describe("the built-in scripts' storage schemas", () => {
  for (const [component, schema] of [
    [authSingleSig, authSingleSigStorage],
    [authGuardedMultisig, authGuardedMultisigStorage],
    [authNetworkAccount, authNetworkAccountStorage],
    [fungibleFaucet, fungibleFaucetStorage],
  ] as const) {
    test(`${component.scriptId} gives its component's slots`, () => {
      assert.deepEqual(
        schemaStorageSlots(schema).map(comparable),
        component.storageSlots.map(comparable),
      );
    });
  }
});
