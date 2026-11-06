import { expect, test } from "@playwright/test";
import { createCounterScript } from "./editor";
import {
  logBrowserErrors,
  startTutorial,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// A failed action resets its loading state, says why it failed, and keeps the
// dialog open with the user's input. Each test checks the forced error's text,
// to show the failure really happened.

test("create wallet: recovers when the prover fails, then retries", async ({
  page,
}) => {
  logBrowserErrors(page);
  // The prover is called to fund the wallet, once it's in the client's store.
  const prover = /tx-prover\.testnet\.miden\.io/;
  await page.route(prover, (route) => route.abort());
  // Only tutorials and the mock network offer to create a wallet.
  await startTutorial(page, "Create and fund a wallet");
  await page.getByRole("button", { name: "Create new account" }).click();
  await page.getByRole("menuitem", { name: "Create new wallet" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Wallet" });
  const name = dialog.getByRole("textbox", { name: "Name" });
  const storageMode = dialog.getByRole("switch", { name: /Storage mode/ });
  const submit = dialog.getByRole("button", { name: "Create" });
  await name.fill("Retried Wallet");
  await storageMode.click();
  await submit.click();

  await expect(page.getByText("Failed to create wallet.")).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
  await expect(page.getByText(/failed to prove transaction/)).toBeVisible();
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveText("Create");
  await expect(dialog).toBeVisible();
  await expect(name).toHaveValue("Retried Wallet");
  await expect(storageMode).not.toBeChecked();
  const walletRows = page.getByRole("row", { name: /Retried Wallet/ });
  await expect(walletRows).toHaveCount(0);

  await page.unroute(prover);
  await submit.click();
  await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
  await expect(walletRows).toHaveCount(1);
  await expect(walletRows).toContainText("Private");
});

test("create script: recovers when the request fails, then cancels", async ({
  page,
}) => {
  logBrowserErrors(page);
  await page.route(/\/scripts$/, (route) =>
    route.request().method() === "POST" ? route.abort() : route.fallback(),
  );
  await page.goto("/scripts");
  const create = page.getByRole("button", { name: "Create new script" });
  await expect(create).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await create.click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create Script" });
  const name = dialog.getByLabel("Name");
  const submit = dialog.getByRole("button", { name: "Create" });
  await name.fill("failed-script");
  await submit.click();

  await expect(page.getByText("Failed to create script.")).toBeVisible();
  await expect(page.getByText("Failed to fetch")).toBeVisible();
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveText("Create");
  await expect(name).toHaveValue("failed-script");

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});

test("compile: recovers when the request fails", async ({ page }) => {
  logBrowserErrors(page);
  await createCounterScript(page);
  await page.route(/\/scripts\/[0-9a-f-]{36}$/, (route) =>
    route.request().method() === "PATCH" ? route.abort() : route.fallback(),
  );
  const compile = page.getByRole("button", { name: "Compile" });
  await compile.click();

  await expect(page.getByText("Script compilation failed.")).toBeVisible();
  await expect(
    page.getByText(/Compile request failed after .*: Failed to fetch/).first(),
  ).toBeVisible();
  await expect(compile).toBeEnabled();
  await expect(compile).not.toContainText("Compiling");
});

test("delete script: recovers when the request fails", async ({ page }) => {
  logBrowserErrors(page);
  await createCounterScript(page);
  await page.route(/\/scripts\/[0-9a-f-]{36}$/, (route) =>
    route.request().method() === "DELETE" ? route.abort() : route.fallback(),
  );
  await page.goto("/scripts");
  const row = page.getByRole("row", { name: /counter-account/ });
  await row.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Delete script" }).click();
  const alert = page.getByRole("alertdialog");
  const submit = alert.getByRole("button", { name: "Delete" });
  await submit.click();

  await expect(page.getByText("Error deleting script.")).toBeVisible();
  await expect(page.getByText("Failed to fetch")).toBeVisible();
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveText("Delete");

  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(alert).toBeHidden();
  // The modal hides the page behind it from the accessibility tree until then.
  await expect(row).toBeVisible();
});

test("import note: recovers from an invalid file", async ({ page }) => {
  logBrowserErrors(page);
  await page.goto("/notes");
  const add = page.getByRole("button", { name: "Add note" });
  await expect(add).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await add.click();
  await page.getByRole("menuitem", { name: "Import note" }).click();
  const dialog = page.getByRole("dialog", { name: "Import Note" });
  await dialog.locator("#note-file").setInputFiles({
    name: "invalid.mno",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("not a note"),
  });
  const submit = dialog.getByRole("button", { name: "Import" });
  await submit.click();

  await expect(page.getByText("Failed to import note.")).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveText("Import");
  await expect(dialog).toBeVisible();
});
