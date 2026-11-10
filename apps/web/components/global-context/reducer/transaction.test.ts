import assert from "node:assert/strict";
import { describe, test } from "node:test";
import reducer from "./transaction.ts";

type State = Parameters<typeof reducer>[0];
type Action = Parameters<typeof reducer>[1];
type Account = State["accounts"][number];
const account = (id: string, extra: object = {}) =>
  ({ id, name: id, ...extra }) as unknown as Account;
const transaction = (id: string, inputNoteIds: string[] = []) =>
  ({
    id,
    inputNotes: inputNoteIds.map((id) => ({ id })),
  }) as unknown as State["transactions"][number];
const state = (accounts: Account[], submitting = true) =>
  ({
    accounts,
    transactions: [],
    submittingTransaction: submitting,
  }) as unknown as State;

describe("transaction reducer", () => {
  test("SUBMITTING_TRANSACTION and TRANSACTION_SUBMITTED toggle the flag", () => {
    const submitting = reducer(state([], false), {
      type: "SUBMITTING_TRANSACTION",
    });
    assert.equal(submitting.submittingTransaction, true);
    const submitted = reducer(submitting, { type: "TRANSACTION_SUBMITTED" });
    assert.equal(submitted.submittingTransaction, false);
  });

  test("SUBMIT_TRANSACTION appends and replaces the account in place", () => {
    const a = account("a");
    const c = account("c");
    const updated = account("b", { name: "after", consumableNoteIds: [] });
    const tx = transaction("t");
    const next = reducer(
      state([a, account("b", { consumableNoteIds: [] }), c]),
      {
        type: "SUBMIT_TRANSACTION",
        payload: { transaction: tx, account: updated },
      } as Action,
    );
    assert.deepEqual(next.transactions, [tx]);
    assert.equal(next.accounts.length, 3);
    assert.equal(next.accounts[0], a);
    assert.equal(next.accounts[1]?.id, "b");
    assert.equal(next.accounts[1]?.name, "after");
    assert.equal(next.accounts[2], c);
    assert.equal(next.submittingTransaction, false);
  });

  test("SUBMIT_TRANSACTION keeps what only the app knows about the account", () => {
    const multisig = { config: {}, proposals: [] };
    const current = account("b", {
      multisig,
      consumableNoteIds: ["n1", "n2", "n3"],
    });
    // As rebuilt from the store: no multisig data, no consumable notes.
    const rebuilt = account("b", { nonce: 2, consumableNoteIds: [] });
    const next = reducer(state([account("a"), current]), {
      type: "SUBMIT_TRANSACTION",
      payload: { transaction: transaction("t", ["n2"]), account: rebuilt },
    } as Action);
    const updated = next.accounts[1] as unknown as Record<string, unknown>;
    assert.equal(updated.nonce, 2);
    assert.equal(updated.multisig, multisig);
    // Minus the note the transaction consumed.
    assert.deepEqual(updated.consumableNoteIds, ["n1", "n3"]);
  });

  test("SUBMIT_TRANSACTION for a deleted account still records the transaction", () => {
    const a = account("a");
    const b = account("b");
    const tx = transaction("t");
    const next = reducer(state([a, b]), {
      type: "SUBMIT_TRANSACTION",
      payload: { transaction: tx, account: account("missing") },
    } as Action);
    assert.deepEqual(next.transactions, [tx]);
    assert.equal(next.submittingTransaction, false);
    assert.equal(next.accounts.length, 2);
    assert.equal(next.accounts[0], a);
    assert.equal(next.accounts[1], b);
  });
});
