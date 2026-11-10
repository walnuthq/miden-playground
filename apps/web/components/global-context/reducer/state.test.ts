import assert from "node:assert/strict";
import { describe, test } from "node:test";
import reducer from "./state.ts";

type State = Parameters<typeof reducer>[0];
type Action = Parameters<typeof reducer>[1];
type Account = State["accounts"][number];
type Transaction = State["transactions"][number];
const account = (id: string) => ({ id, name: id }) as unknown as Account;
const transaction = (id: string) => ({ id }) as unknown as Transaction;
const note = (id: string) => ({ id }) as unknown as State["inputNotes"][number];

describe("state reducer", () => {
  test("SYNCING_STATE sets the flag", () => {
    const next = reducer({ syncingState: false } as unknown as State, {
      type: "SYNCING_STATE",
      payload: { syncingState: true },
    });
    assert.equal(next.syncingState, true);
  });

  test("SYNC_STATE merges the payload with what was added meanwhile", () => {
    const [a, b, c] = [account("a"), account("b"), account("c")];
    const [t1, t2, t3] = [
      transaction("t1"),
      transaction("t2"),
      transaction("t3"),
    ];
    const payloadNote = note("n");
    const current = {
      accounts: [b, c],
      inputNotes: [note("old")],
      transactions: [t2, t3],
      syncingState: true,
    } as unknown as State;
    const next = reducer(current, {
      type: "SYNC_STATE",
      payload: {
        accounts: [a, b],
        inputNotes: [payloadNote],
        transactions: [t1, t2],
      },
    } as Action);
    assert.deepEqual(
      next.accounts.map(({ id }) => id),
      ["a", "b", "c"],
    );
    assert.equal(next.accounts[0], a);
    assert.equal(next.accounts[1], b);
    assert.equal(next.accounts[2], c);
    assert.deepEqual(next.inputNotes, [payloadNote]);
    assert.deepEqual(
      next.transactions.map(({ id }) => id),
      ["t1", "t2", "t3"],
    );
    assert.equal(next.syncingState, false);
  });
});
