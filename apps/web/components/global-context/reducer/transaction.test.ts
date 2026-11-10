import assert from "node:assert/strict";
import { describe, test } from "node:test";
import reducer from "./transaction.ts";

type State = Parameters<typeof reducer>[0];
type Action = Parameters<typeof reducer>[1];
type Account = State["accounts"][number];
const account = (id: string, extra: object = {}) =>
  ({ id, name: id, ...extra }) as unknown as Account;
const transaction = (id: string) =>
  ({ id }) as unknown as State["transactions"][number];
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
    const updated = account("b", { name: "after" });
    const tx = transaction("t");
    const next = reducer(state([a, account("b"), c]), {
      type: "SUBMIT_TRANSACTION",
      payload: { transaction: tx, account: updated },
    } as Action);
    assert.deepEqual(next.transactions, [tx]);
    assert.equal(next.accounts.length, 3);
    assert.equal(next.accounts[0], a);
    assert.equal(next.accounts[1], updated);
    assert.equal(next.accounts[2], c);
    assert.equal(next.submittingTransaction, false);
  });
});
