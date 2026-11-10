import assert from "node:assert/strict";
import { describe, test } from "node:test";
import reducer from "./account.ts";

type State = Parameters<typeof reducer>[0];
type Action = Parameters<typeof reducer>[1];
type Account = State["accounts"][number];
const account = (id: string, extra: object = {}) =>
  ({
    id,
    name: id,
    updatedAt: 0,
    ...extra,
  }) as unknown as Account;
const state = (accounts: Account[]) =>
  ({
    accounts,
    transactions: [],
    submittingTransaction: true,
  }) as unknown as State;

describe("account reducer", () => {
  test("NEW_ACCOUNT appends", () => {
    const a = account("a");
    const b = account("b");
    const next = reducer(state([a]), {
      type: "NEW_ACCOUNT",
      payload: { account: b },
    } as Action);
    assert.deepEqual(next.accounts, [a, b]);
  });

  test("DELETE_ACCOUNT removes the middle one, keeping order", () => {
    const a = account("a");
    const c = account("c");
    const next = reducer(state([a, account("b"), c]), {
      type: "DELETE_ACCOUNT",
      payload: { accountId: "b" },
    } as Action);
    assert.equal(next.accounts.length, 2);
    assert.equal(next.accounts[0], a);
    assert.equal(next.accounts[1], c);
  });

  test("UPDATE_ACCOUNT replaces in place and stamps updatedAt", () => {
    const a = account("a");
    const c = account("c");
    const next = reducer(state([a, account("b"), c]), {
      type: "UPDATE_ACCOUNT",
      payload: { account: account("b", { name: "renamed" }) },
    } as Action);
    assert.equal(next.accounts.length, 3);
    assert.equal(next.accounts[0], a);
    assert.equal(next.accounts[1]?.id, "b");
    assert.equal(next.accounts[1]?.name, "renamed");
    assert.ok((next.accounts[1]?.updatedAt ?? 0) > 0);
    assert.equal(next.accounts[2], c);
  });
});
