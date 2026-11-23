import assert from "node:assert/strict";
import { test } from "node:test";
import { findPackages } from "./project-files.ts";
import { parseProjectLink } from "./project-link.ts";

// scripts/share-project.mjs, the terminal path to a project link: plain
// JavaScript at the repository's root, so loaded by URL (untyped).
const script: {
  findPackages: typeof findPackages;
  projectLink: (
    webUrl: string,
    link: {
      networkId: string;
      title: string;
      scriptIds: string[];
      accounts?: { name: string; address: string }[];
    },
  ) => string;
  parseAccount: (
    value: string,
    networkId: string,
  ) => { name: string; address: string };
} = await import(
  new URL("../../../../scripts/share-project.mjs", import.meta.url).href
);

const folders = [
  // One package, the folder itself.
  ["counter/miden-project.toml", "counter/src/lib.rs", "counter/Cargo.toml"],
  // Several, with build outputs and hidden directories to skip, and a
  // manifest without its source.
  [
    "bank/bank-account/miden-project.toml",
    "bank/bank-account/src/lib.rs",
    "bank/deposit-note/miden-project.toml",
    "bank/deposit-note/src/lib.rs",
    "bank/draft/miden-project.toml",
    "bank/target/x/miden-project.toml",
    "bank/target/x/src/lib.rs",
    "bank/.git/y/miden-project.toml",
    "bank/.git/y/src/lib.rs",
    "bank/node_modules/z/miden-project.toml",
    "bank/node_modules/z/src/lib.rs",
  ],
  [],
];

test("the script finds the packages Import Project finds", () => {
  for (const paths of folders) {
    assert.deepEqual(script.findPackages(paths), findPackages(paths));
  }
  assert.deepEqual(
    script.findPackages(folders[1] ?? []).map(({ directory }) => directory),
    ["bank/bank-account", "bank/deposit-note"],
  );
});

test("the script's link opens in the playground", () => {
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];
  const account = script.parseAccount(
    "My bank = 2=mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv_qr7qqq9wr6w",
    "mtst",
  );
  assert.deepEqual(account, {
    name: "My bank = 2",
    address: "mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv_qr7qqq9wr6w",
  });
  const url = script.projectLink("https://playground.miden.xyz", {
    networkId: "mtst",
    title: "Bank & co",
    scriptIds: ids,
    accounts: [account],
  });
  assert.deepEqual(parseProjectLink(new URL(url).hash), {
    link: {
      networkId: "mtst",
      title: "Bank & co",
      scriptIds: ids,
      accounts: [account],
    },
    droppedScripts: 0,
    droppedAccounts: 0,
  });
});

test("the script refuses an account of another network or without a name", () => {
  for (const value of [
    "x=mm1arnfum9xuwwlrvgvrefejwvlavn3vk24",
    "=mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv",
    "mtst1arjkfl0j33qk25gpl2tqrd6npsptfavv",
  ]) {
    assert.throws(() => script.parseAccount(value, "mtst"));
  }
});
