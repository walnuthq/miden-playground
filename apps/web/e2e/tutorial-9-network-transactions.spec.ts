import { expect, test } from "./bread";
import { waitForEditorText } from "./editor";
import { componentRow, invoke } from "./example";
import {
  logBrowserErrors,
  nextStep,
  pickAccount,
  selectOption,
  startTutorial,
  TRANSACTION_TIMEOUT,
  tutorialPanel,
} from "./tutorial";

// The tutorial starts with the counter-contract example's compiled packages
// (counter-account and increment-note), which it fetches from the API: run
// apps/api next to the web app. They come precompiled, so the compile service
// isn't needed.
//
// The network note is created by a new Bread Wallet (see ./bread.ts), funded
// from its "Fund your wallet" prompt first to pay the fees. The network
// transaction builder then consumes it, which can take a while.
test("tutorial 9: network transactions", async ({ page, bread }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await bread.fund();
  await startTutorial(page, "Network transactions");
  await expect(page).toHaveURL(/\/accounts$/);

  await test.step("1. introduction", async () => {
    await nextStep(page);
  });

  await test.step("2. deploy the network counter", async () => {
    await panel.openLink("accounts page", /\/accounts$/);
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("menuitem", { name: "Deploy account" }).click();
    const dialog = page
      .getByRole("dialog")
      .filter({ hasText: "Deploy Account" });
    await dialog.getByLabel("Name").fill("Network Counter");
    await expect(dialog.getByRole("combobox").first()).toContainText("Public");
    await selectOption(page, "Auth Component", "Network Account");
    await selectOption(page, "Account Component", "Counter Contract");
    await dialog.getByPlaceholder("Select allowed note-scripts…").click();
    await page.getByRole("option", { name: "increment-note" }).click();
    // Escape would close the whole dialog: click another field to close the
    // list (which hides the rest of the dialog from the accessibility tree).
    await dialog.locator("#name").click();
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(
      dialog.getByRole("toolbar").getByText("increment-note"),
    ).toBeVisible();
    // The counter's map slot, with the count under key 1.
    await expect(
      dialog.getByLabel("counter_account::counter_contract::count_map"),
    ).toHaveValue("1:0");
    await dialog.getByRole("button", { name: "Deploy" }).click();
    await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
    await nextStep(page);
  });

  await test.step("3. read the increment-note script", async () => {
    // The script comes from the API: its id is a UUID, its name shows in the
    // header.
    const link = panel.root.getByRole("link", {
      name: "increment-note script",
    });
    await expect(link).toHaveAttribute("href", /\/scripts\/[0-9a-f-]{36}$/);
    await link.click();
    await expect(
      page.locator('header [data-slot="breadcrumb-page"]'),
    ).toHaveText("increment-note");
    await waitForEditorText(page, "#[note_script]");
    // Read-only: the tutorial doesn't have it compiled again.
    await expect(page.getByRole("button", { name: "Compile" })).toHaveCount(0);
    await nextStep(page);
  });

  await test.step("4. create the network note", async () => {
    await bread.connect(page);
    await panel.openLink("notes page", /\/notes$/);
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("menuitem", { name: "Create note" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Create Note" });
    await pickAccount(dialog, "Network Counter");
    await selectOption(page, "Script", "increment-note");
    const networkNote = dialog.getByRole("switch", { name: /Network note/ });
    await networkNote.click();
    await expect(networkNote).toBeChecked();
    // The transaction expires about a minute after it's executed: Bread
    // approves it as soon as its popup opens.
    const request = await bread.approve(
      () => dialog.getByRole("button", { name: "Create", exact: true }).click(),
      { timeout: TRANSACTION_TIMEOUT },
    );
    expect(request).toContain("Confirm Transaction");
    // Completes once the network transaction builder has consumed the note.
    await nextStep(page, { timeout: 2 * TRANSACTION_TIMEOUT });
  });

  await test.step("5. read the updated count", async () => {
    await panel.openLink("network counter", /\/accounts\/mtst1[0-9a-z]+$/);
    await page.getByRole("tab", { name: "Components" }).click();
    // The Playground can't sign for a network account, so increment_count has
    // no Invoke button; the read-only get_count runs locally.
    await expect(
      componentRow(page, "increment_count").getByRole("button", {
        name: "Invoke",
      }),
    ).toHaveCount(0);
    const row = await invoke(page, "get_count");
    await expect(row.getByRole("cell").last()).toHaveText(/^1\s*Invoke$/, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(panel.nextTutorialButton).toBeVisible();
  });
});
