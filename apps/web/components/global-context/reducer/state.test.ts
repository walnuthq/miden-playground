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
    const [b, c] = [account("b"), account("c")];
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
        accounts: [b],
        previousAccounts: [b],
        inputNotes: [payloadNote],
        transactions: [t1, t2],
      },
    } as Action);
    assert.deepEqual(
      next.accounts.map(({ id }) => id),
      ["b", "c"],
    );
    assert.equal(next.accounts[0], b);
    assert.equal(next.accounts[1], c);
    assert.deepEqual(next.inputNotes, [payloadNote]);
    assert.deepEqual(
      next.transactions.map(({ id }) => id),
      ["t1", "t2", "t3"],
    );
    assert.equal(next.syncingState, false);
  });

  describe("SYNC_STATE accounts", () => {
    const sync = (
      current: Account[],
      previousAccounts: Account[],
      accounts: Account[],
    ) =>
      reducer(
        {
          accounts: current,
          inputNotes: [],
          transactions: [],
          syncingState: true,
        } as unknown as State,
        {
          type: "SYNC_STATE",
          payload: {
            accounts,
            previousAccounts,
            inputNotes: [],
            transactions: [],
          },
        } as Action,
      );

    test("an account deleted during the sync is not restored", () => {
      const [a, b] = [account("a"), account("b")];
      const next = sync([b], [a, b], [account("a"), account("b")]);
      assert.deepEqual(
        next.accounts.map(({ id }) => id),
        ["b"],
      );
    });

    test("an account changed during the sync keeps the state object", () => {
      const old = account("a");
      const newer = account("a");
      const next = sync([newer], [old], [account("a")]);
      assert.equal(next.accounts.length, 1);
      assert.equal(next.accounts[0], newer);
    });

    test("an untouched account is replaced by the synced one", () => {
      const a = account("a");
      const synced = account("a");
      const next = sync([a], [a], [synced]);
      assert.equal(next.accounts.length, 1);
      assert.equal(next.accounts[0], synced);
    });

    test("an account added during the sync is kept after the synced ones", () => {
      const [a, added] = [account("a"), account("z")];
      const synced = account("a");
      const next = sync([added, a], [a], [synced]);
      assert.deepEqual(
        next.accounts.map(({ id }) => id),
        ["a", "z"],
      );
      assert.equal(next.accounts[0], synced);
      assert.equal(next.accounts[1], added);
    });
  });
});
