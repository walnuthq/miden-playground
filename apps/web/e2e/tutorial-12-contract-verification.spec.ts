import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { replaceInEditor } from "./editor";
import {
  logBrowserErrors,
  nextStep,
  selectOption,
  startTutorial,
  tutorialPanel,
  TRANSACTION_TIMEOUT,
} from "./tutorial";

// Tutorial 12 needs no wallet: the contracts use No Auth. Compiling, exporting
// and verifying scripts go through apps/api: run it along with the dev server.
// Unzipping the exported script uses the system's `unzip`.
const procedureRow = (page: Page, procedure: string) =>
  page
    .getByRole("row")
    .filter({ has: page.getByText(procedure, { exact: true }) })
    // The innermost row: the component's row contains its procedures table.
    .last();

test("tutorial 12: contract verification", async ({ page }) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Contract verification");
  await expect(page).toHaveURL(/\/scripts$/);
  // The script name has a random suffix, unique to this run.
  const scriptName = (await panel.root
    .locator("strong")
    .filter({ hasText: /^counter-account-/ })
    .first()
    .textContent())!;
  const workDir = await mkdtemp(path.join(tmpdir(), "contract-verification-"));

  try {
    await test.step("1. create the counter contract script", async () => {
      await page.getByRole("button", { name: "Create new script" }).click();
      const dialog = page
        .getByRole("dialog")
        .filter({ hasText: "Create Script" });
      await dialog.getByLabel("Name").fill(scriptName);
      await selectOption(page, "Type", "Account Component");
      await selectOption(page, "Example", "Counter Contract");
      await dialog.getByRole("button", { name: "Create" }).click();
      await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
      await nextStep(page);
    });

    await test.step("2. add reset_count and compile", async () => {
      await replaceInEditor(
        page,
        "    fn increment_count(&mut self) -> Felt;\n}",
        [
          "    fn increment_count(&mut self) -> Felt;",
          "    #[account_procedure]",
          "    fn reset_count(&mut self);",
          "}",
        ].join("\n"),
      );
      await replaceInEditor(
        page,
        "        new_value\n    }\n}",
        [
          "        new_value",
          "    }",
          "",
          "    /// Resets the counter value to zero",
          "    fn reset_count(&mut self) {",
          "        let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);",
          "        self.count_map.set(key, felt!(0));",
          "    }",
          "}",
        ].join("\n"),
      );
      await page.getByRole("button", { name: "Compile" }).click();
      await expect(page.getByText("Script compiled successfully.")).toBeVisible(
        { timeout: TRANSACTION_TIMEOUT },
      );
      await page.getByRole("tab", { name: "Metadata" }).click();
      // Listed under "Package exports".
      await expect(
        page.getByRole("row", { name: "reset_count fn reset_count()" }),
      ).toBeVisible();
      await nextStep(page);
    });

    await test.step("3. deploy the counter contract", async () => {
      await panel.openLink("accounts page", /\/accounts$/);
      await page.getByRole("button", { name: "Create new account" }).click();
      await page.getByRole("menuitem", { name: "Deploy account" }).click();
      const dialog = page
        .getByRole("dialog")
        .filter({ hasText: "Deploy Account" });
      await dialog.getByLabel("Name").fill("My Counter");
      await selectOption(page, "Account Component", "Counter Contract");
      await dialog.getByRole("button", { name: "Deploy" }).click();
      await expect(dialog).toBeHidden({ timeout: TRANSACTION_TIMEOUT });
      await nextStep(page);
    });

    await test.step("4. import the unverified contract", async () => {
      await panel.root.getByRole("button", { name: "Import" }).click();
      await panel.openLink(
        'open its "Components" tab',
        /\/accounts\/mtst1[0-9a-z]+\?tab=components$/,
      );
      await expect(
        page.getByText(
          "This account has no verified custom account components",
          // The tutorial panel quotes it too.
          { exact: true },
        ),
      ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
      await nextStep(page);
    });

    await test.step("5. export the script", async () => {
      await panel.openLink("scripts page", /\/scripts$/);
      await page
        .getByRole("row")
        .filter({ hasText: scriptName })
        .getByRole("button", { name: "Open menu" })
        .click();
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("menuitem", { name: "Export script" }).click();
      const archive = path.join(workDir, `${scriptName}.zip`);
      await (await downloadPromise).saveAs(archive);
      execFileSync("unzip", [
        "-q",
        archive,
        "-d",
        path.join(workDir, "project"),
      ]);
      await nextStep(page);
    });

    await test.step("6. verify the imported contract", async () => {
      await panel.openLink(
        'imported contract\'s "Components" tab',
        /\/accounts\/mtst1[0-9a-z]+\?tab=components$/,
      );
      await page
        .getByRole("button", { name: "Verify account component" })
        .click();
      const dialog = page
        .getByRole("dialog")
        .filter({ hasText: "Verify Account Component" });
      await dialog
        .locator("#project-dir")
        .setInputFiles(path.join(workDir, "project"));
      await dialog.getByRole("button", { name: "Verify", exact: true }).click();
      // Completes once the verification service knows the contract's code.
      await nextStep(page);
    });

    await test.step("7. increment, then reset the verified contract", async () => {
      await expect(procedureRow(page, "reset_count")).toBeVisible({
        timeout: TRANSACTION_TIMEOUT,
      });
      await procedureRow(page, "increment_count")
        .getByRole("button", { name: "Invoke" })
        .click();
      await expect(
        page.getByText("Transaction submitted.").first(),
      ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
      await procedureRow(page, "reset_count")
        .getByRole("button", { name: "Invoke" })
        .click();
      // Completes once both transactions are committed and the count is 0.
      // This is the last tutorial: there's no "Next tutorial".
      await expect(
        panel.root.getByRole("button", { name: "Back to tutorials list" }),
      ).toBeEnabled({
        timeout: 2 * TRANSACTION_TIMEOUT,
      });
    });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
