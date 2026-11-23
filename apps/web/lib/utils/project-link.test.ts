import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_LINK_ACCOUNT_NAME_LENGTH,
  MAX_LINK_ACCOUNTS,
  MAX_LINK_SCRIPTS,
  MAX_LINK_TITLE_LENGTH,
  type ProjectLink,
  parseProjectLink,
  projectLinkFragment,
  projectLinkUrl,
  shareableAccounts,
} from "./project-link.ts";

const ID_1 = "11111111-1111-4111-8111-111111111111";
const ID_2 = "22222222-2222-4222-8222-222222222222";
const ADDRESS_1 = "mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv_qr7qqq9wr6w";
const ADDRESS_2 = "mtst1apxtmjhlua0s5vt5sg3ymtnyxclasaf0";

const link: ProjectLink = {
  networkId: "mtst",
  title: "Bank: deposits & withdrawals",
  scriptIds: [ID_1, ID_2],
  accounts: [
    { name: "Bank, main", address: ADDRESS_1 },
    { name: "a:b&c=d", address: ADDRESS_2 },
  ],
};

const parsed = (hash: string) => {
  const result = parseProjectLink(hash);
  if ("error" in result) {
    assert.fail(result.error);
  }
  return result;
};

test("a link reads back as it was built, names with separators included", () => {
  const url = projectLinkUrl("https://playground.miden.xyz", link);
  assert.ok(url.startsWith("https://playground.miden.xyz/open#v=1&n=mtst&"));
  const { hash } = new URL(url);
  assert.deepEqual(parsed(hash), {
    link,
    droppedScripts: 0,
    droppedAccounts: 0,
  });
});

test("a link without a title or accounts", () => {
  const fragment = projectLinkFragment({
    ...link,
    title: " ",
    accounts: [],
  });
  assert.equal(fragment, `v=1&n=mtst&s=${ID_1},${ID_2}`);
  assert.deepEqual(parsed(fragment).link, {
    networkId: "mtst",
    title: "",
    scriptIds: [ID_1, ID_2],
    accounts: [],
  });
});

test("not a link, another version, another network", () => {
  assert.deepEqual(parseProjectLink(""), {
    error: "This isn't a project link.",
  });
  assert.match(
    (parseProjectLink(`v=2&n=mtst&s=${ID_1}`) as { error: string }).error,
    /newer version/,
  );
  for (const network of ["mmck", "mlcl", "nope", ""]) {
    assert.ok("error" in parseProjectLink(`v=1&n=${network}&s=${ID_1}`));
  }
});

test("bad and duplicate script ids are dropped; none left is an error", () => {
  const result = parsed(`v=1&n=mdev&s=${ID_1},nope,${ID_1},%E0%A4%A,${ID_2}`);
  assert.deepEqual(result.link.scriptIds, [ID_1, ID_2]);
  assert.equal(result.droppedScripts, 3);
  assert.deepEqual(parseProjectLink("v=1&n=mtst&s=nope"), {
    error: "This link holds no script.",
  });
  assert.deepEqual(parseProjectLink("v=1&n=mtst"), {
    error: "This link holds no script.",
  });
});

test("accounts of another network, malformed or duplicated are dropped", () => {
  const result = parsed(
    `v=1&n=mtst&s=${ID_1}&a=ok:${ADDRESS_1},mainnet:mm1arnfum9xuwwlrvgvrefejwvlavn3vk24,again:${ADDRESS_1},no-separator,bad:MTST1X,:${ADDRESS_2}`,
  );
  assert.deepEqual(result.link.accounts, [
    { name: "ok", address: ADDRESS_1 },
    // An empty name gets one.
    { name: "Account 2", address: ADDRESS_2 },
  ]);
  assert.equal(result.droppedAccounts, 4);
});

test("bounds: scripts, accounts, title and names", () => {
  const ids = Array.from(
    { length: MAX_LINK_SCRIPTS + 2 },
    (_, index) =>
      `${index.toString(16).padStart(8, "0")}-1111-4111-8111-111111111111`,
  );
  const accounts = Array.from(
    { length: MAX_LINK_ACCOUNTS + 1 },
    (_, index) => `n:mtst1a${"q".repeat(index + 1)}`,
  );
  const result = parsed(
    `v=1&n=mtst&t=${"t".repeat(200)}&s=${ids.join(",")}&a=${accounts.join(",")}`,
  );
  assert.equal(result.link.scriptIds.length, MAX_LINK_SCRIPTS);
  assert.equal(result.droppedScripts, 2);
  assert.equal(result.link.accounts.length, MAX_LINK_ACCOUNTS);
  assert.equal(result.link.title.length, MAX_LINK_TITLE_LENGTH);
  const longName = parsed(
    projectLinkFragment({
      ...link,
      accounts: [{ name: "x".repeat(100), address: ADDRESS_1 }],
    }),
  );
  assert.equal(
    longName.link.accounts[0]?.name.length,
    MAX_LINK_ACCOUNT_NAME_LENGTH,
  );
});

test("Share project ticks public accounts on chain, not the wallet or the faucet", () => {
  const account = (
    id: string,
    fields: Partial<{ isPublic: boolean; isNew: boolean; address: string }>,
  ) => ({
    id,
    name: id,
    address: ADDRESS_1,
    isPublic: true,
    isNew: false,
    ...fields,
  });
  const offered = shareableAccounts(
    [
      account("faucet", {}),
      account("counter", {}),
      account("wallet", { address: ADDRESS_2 }),
      account("secret", { isPublic: false }),
      account("fresh", { isNew: true }),
      account("elsewhere", {
        address: "mm1arnfum9xuwwlrvgvrefejwvlavn3vk24",
      }),
    ],
    {
      networkId: "mtst",
      faucetId: "faucet",
      isConnectedWallet: (id) => id === "wallet",
    },
  );
  assert.deepEqual(
    offered.map(({ id, checked, disabledReason }) => [
      id,
      checked,
      disabledReason !== undefined,
    ]),
    [
      ["counter", true, false],
      ["wallet", false, false],
      ["secret", false, true],
      ["fresh", false, true],
      ["elsewhere", false, true],
    ],
  );
});
