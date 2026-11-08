import { expect, type Page, test } from "@playwright/test";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The counter contract (counterContractAddress in lib/constants.ts) is deployed
// on testnet and anyone can increment it, so its count is compared before and
// after rather than checked against fixed values.
const invoke = async (page: Page, procedure: string) => {
  const row = page
    .getByRole("row")
    .filter({ has: page.getByText(procedure, { exact: true }) })
    // The innermost row: the component's row contains its procedures table.
    .last();
  await row.getByRole("button", { name: "Invoke" }).click();
  return row;
};

const getCount = async (page: Page) => {
  const row = await invoke(page, "get_count");
  const result = row.getByRole("cell").last();
  await expect(result).toHaveText(/^\d+\s*Invoke$/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  return Number((await result.textContent())!.match(/^\d+/)![0]);
};

test("tutorial 6: interact with the counter contract", async ({
  page,
  context,
}) => {
  logBrowserErrors(page);
  // To copy the contract address from the tutorial panel.
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Interact with the counter contract");
  await expect(page).toHaveURL(/\/scripts$/);

  await test.step("1. open the counter contract script", async () => {
    // Rows are clickable, without links. The script's id is its name, so the
    // ID column (hidden on phones) reads the same: click the Name cell.
    await page
      .getByRole("cell", { name: "counter-account", exact: true })
      .last()
      .click();
    await expect(page).toHaveURL(/\/scripts\/counter-account$/);
    await nextStep(page);
  });

  await test.step("2. read the Rust code", async () => {
    await nextStep(page);
  });

  await test.step("3. explore the compiled package", async () => {
    // The embedded package carries no MASM: its tab is disabled.
    await expect(page.getByRole("tab", { name: "MASM" })).toBeDisabled();
    await page.getByRole("tab", { name: "Manifest" }).click();
    // Listed under "Package exports", get_count flagged read-only.
    await expect(
      page.getByRole("row", {
        name: "get_count Read-only fn get_count() -> Felt",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("row", {
        name: "increment_count fn increment_count() -> Felt",
      }),
    ).toBeVisible();
    await nextStep(page);
  });

  await test.step("4. import the counter contract", async () => {
    // The panel shows a shortened address: copy the full one.
    await panel.root
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-copy") })
      .last()
      .click();
    const address = await page.evaluate(() => navigator.clipboard.readText());
    expect(address).toMatch(/^mtst1[0-9a-z]+_[0-9a-z]+$/);
    await panel.openLink("accounts page", /\/accounts$/);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Import account" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Account" });
    await dialog.getByLabel("Name").fill("Counter Contract");
    await dialog.getByLabel("Address").fill(address);
    await dialog.getByRole("button", { name: "Import" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    // The sidebar also lists a "Counter Contract" component.
    await panel.openLink("click its name", /\/accounts\/mtst1[0-9a-z]+$/);
    // The import matched the account's code against the workspace's
    // counter-account package, so its component is listed.
    await page.getByRole("tab", { name: "Components" }).click();
    await expect(
      page.getByRole("cell", { name: "counter-account", exact: true }),
    ).toBeVisible();
    await nextStep(page);
  });

  let before = 0;
  await test.step("5. invoke get_count, then increment_count", async () => {
    before = await getCount(page);
    await invoke(page, "increment_count");
    // Completes once the account's nonce has increased.
    await nextStep(page);
  });

  await test.step("6. read the updated count", async () => {
    await expect
      .poll(() => getCount(page), { timeout: TRANSACTION_TIMEOUT })
      .toBeGreaterThan(before);
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
