import type { Page, Response } from "@playwright/test";
import { expect, test } from "./bread";
import { componentRow, invoke } from "./example";
import {
  logBrowserErrors,
  pickAccount,
  selectOption,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// Miden Partner Mainnet, with real funds: skipped unless MAINNET_E2E=1, and
// run on an onboarded Mainnet Bread wallet, in place (BREAD_PROFILE_DIR,
// BREAD_PASSWORD, BREAD_PROFILE_IN_PLACE=1: see e2e/README.md). Each run costs
// that wallet about 0.0015 USDCX: the network account's 0.001 funding, the
// network note's fee sponsorship and the two transactions' fees.
//
// A new Mainnet sandbox comes with the counter-contract example's
// counter-account component and increment-note script. Partner Mainnet only
// creates invited accounts and network accounts, so this deploys a network
// counter, funded from Bread, then increments it with a network note sent from
// Bread, which the network transaction builder consumes.
test.skip(
  process.env.MAINNET_E2E !== "1" ||
    !process.env.BREAD_PROFILE_DIR ||
    process.env.BREAD_PROFILE_IN_PLACE !== "1",
  "Set MAINNET_E2E=1 and an in-place Mainnet Bread profile (see e2e/README.md)",
);

const ACCOUNT_NAME = "Network Counter";
// A run costs the QA wallet about 0.0015 USDCX: below this, don't start one.
const LOW_BALANCE = 0.002;
// The Playground verifies a deployed account's custom components and a created
// note's script through its API, in the background: wait for that call's
// answer. The registry keys records on code and script roots, the same every
// run: after the first run, it answers that the code is already verified (an
// error, which the API passes on as a 500 and the Playground ignores).
const verification = (page: Page, path: string) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === `/${path}/mm`,
    { timeout: 3 * TRANSACTION_TIMEOUT },
  );

const expectVerified = async (response: Promise<Response>) => {
  const answer = await response;
  const text = await answer.text();
  if (answer.status() !== 200) {
    expect(text, `HTTP ${answer.status()}`).toMatch(/already verified/);
    return;
  }
  expect(JSON.parse(text)).toEqual({ verified: true });
};

const openAccount = async (page: Page) => {
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page.getByRole("cell", { name: ACCOUNT_NAME, exact: true }).click();
  await expect(page).toHaveURL(/\/accounts\/mm1[0-9a-z]+$/);
};

// The count, from the read-only get_count. The Playground can't sign for a
// network account, so increment_count has no Invoke button, but read-only
// procedures run locally against the synced state.
const expectCount = async (page: Page, count: number, timeout: number) => {
  await page.getByRole("tab", { name: "Components" }).click();
  await expect(
    componentRow(page, "increment_count").getByRole("button", {
      name: "Invoke",
    }),
  ).toHaveCount(0);
  const result = componentRow(page, "get_count").getByRole("cell").last();
  await expect(async () => {
    await invoke(page, "get_count");
    await expect(result).toHaveText(new RegExp(`^${count}\\s*Invoke$`), {
      timeout: 10_000,
    });
  }).toPass({ timeout });
};

// The account's USDCX balance, from its Information tab.
const usdcxBalance = async (page: Page) => {
  await page.getByRole("tab", { name: "Information" }).click();
  const amount = page
    .getByRole("row")
    .filter({ hasText: "Fungible Asset" })
    .getByRole("cell")
    .last();
  await expect(amount).toBeVisible();
  return Number(((await amount.textContent()) ?? "").replaceAll(",", ""));
};

test("mainnet: network counter incremented by a network note from Bread", async ({
  page,
  bread,
}) => {
  test.setTimeout(30 * 60_000);
  logBrowserErrors(page);

  await test.step("check the QA wallet's funds", async () => {
    const usdcx = bread.walletPage
      .getByRole("group", { name: "Assets" })
      .getByRole("button", { name: /^USDCX / });
    await expect(usdcx).toContainText(/USDCX\s*[\d.]+\s*USDCX/, {
      timeout: TRANSACTION_TIMEOUT,
    });
    const balance = Number(
      (await usdcx.textContent())?.match(/USDCX\s*([\d.]+)\s*USDCX/)?.[1],
    );
    console.info("QA wallet balance:", balance, "USDCX");
    expect(
      balance,
      "QA wallet low: top it up with an invite code (pnpm qa-wallet fund)",
    ).toBeGreaterThanOrEqual(LOW_BALANCE);
  });

  await test.step("create a Mainnet sandbox", async () => {
    await page.goto("/");
    const create = page.getByRole("button", {
      name: "Create new Mainnet sandbox",
    });
    await expect(create).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    // The page shows the previous sandbox until the new one's store is
    // imported, which replaces the state and closes any dialog opened
    // meanwhile. A profile used in place starts on the last run's Mainnet
    // sandbox, so its badge and accounts prove nothing: wait for the import.
    const storeImported = page.waitForEvent("console", {
      predicate: (message) =>
        message.text().includes("Store imported successfully."),
      timeout: TRANSACTION_TIMEOUT,
    });
    await create.click();
    await storeImported;
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByText(/^Mainnet \|/)).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
  });

  await test.step("connect Bread Wallet", async () => {
    await bread.connect(page);
    // Connecting imports Bread's account: wait for it, or the update can
    // close the Deploy dialog opened meanwhile.
    await expect(
      page.getByRole("cell", { name: "Bread Wallet", exact: true }),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  });

  let fundedBalance = 0;
  await test.step("deploy the network counter, funded from Bread", async () => {
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Deploy account" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    await dialog.getByLabel("Name").fill(ACCOUNT_NAME);
    await expect(dialog.getByRole("combobox").first()).toContainText("Public");
    await selectOption(page, "Auth Component", "Network Account");
    await selectOption(page, "Account Component", "Counter Account");
    await dialog.getByPlaceholder("Select allowed note-scripts…").click();
    await page.getByRole("option", { name: "increment-note" }).click();
    // Escape would close the whole dialog: click another field instead.
    await dialog.locator("#name").click();
    await expect(page.getByRole("listbox")).toBeHidden();
    const accountVerification = verification(
      page,
      "verified-account-components",
    );
    // Bread pays the new account's funding note (MAINNET_FUNDING_AMOUNT).
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Deploy" }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    console.info("Bread funding request:", request.replace(/\s+/g, " "));
    await expect(dialog).toBeHidden({ timeout: 3 * TRANSACTION_TIMEOUT });
    await openAccount(page);
    await expectCount(page, 0, TRANSACTION_TIMEOUT);
    // Deploying verifies the account's custom component (counter-account).
    await expectVerified(accountVerification);
    fundedBalance = await usdcxBalance(page);
    console.info("Network counter balance after deployment:", fundedBalance);
    expect(fundedBalance).toBeGreaterThan(0);
  });

  await test.step("increment it with a network note from Bread", async () => {
    await page.getByRole("link", { name: "Notes", exact: true }).click();
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await pickAccount(dialog, ACCOUNT_NAME);
    await selectOption(page, "Script", "increment-note");
    const networkNote = dialog.getByRole("switch", { name: /Network note/ });
    await networkNote.click();
    await expect(networkNote).toBeChecked();
    // Creating the note verifies its script (increment-note).
    const noteVerification = verification(page, "verified-notes");
    // The transaction expires about a minute after it's executed: approve it
    // as soon as Bread's popup opens.
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    console.info("Bread note request:", request.replace(/\s+/g, " "));
    await openAccount(page);
    // The network transaction builder consumes the note.
    await expectCount(page, 1, 3 * TRANSACTION_TIMEOUT);
    await expectVerified(noteVerification);
  });

  await test.step("the note's sender paid for its consumption", async () => {
    // The network transaction paid its fee out of the account's vault, after
    // collecting the FEE_SPONSORSHIP note Bread's fee payment created for the
    // network note (priced by `clientNetworkNoteFee`): the balance must not
    // have dropped.
    await expect(async () => {
      const balance = await usdcxBalance(page);
      console.info("Network counter balance after the note:", balance);
      expect(balance).toBeGreaterThanOrEqual(fundedBalance);
    }).toPass({ timeout: TRANSACTION_TIMEOUT });
  });
});
