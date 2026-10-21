import { expect, type Page, test } from "@playwright/test";
import {
  logBrowserErrors,
  nextStep,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The counter contract is deployed on testnet and anyone can increment it, so
// its count is compared before and after rather than checked against fixed
// values.
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
    // Rows are clickable, without links.
    await page
      .getByRole("cell", { name: "counter-contract", exact: true })
      .click();
    await expect(page).toHaveURL(/\/scripts\/counter-value-contract$/);
    await nextStep(page);
  });

  await test.step("2. read the Rust code", async () => {
    await nextStep(page);
  });

  await test.step("3. read the MASM code", async () => {
    await page.getByRole("tab", { name: "MASM" }).click();
    await expect(page.getByText("increment_count").first()).toBeVisible();
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
    await nextStep(page);
  });

  let before = 0;
  await test.step("5. invoke get_count, then increment_count", async () => {
    await page.getByRole("tab", { name: "Components" }).click();
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
