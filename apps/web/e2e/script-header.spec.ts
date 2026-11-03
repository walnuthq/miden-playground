import { expect, test } from "@playwright/test";
import {
  COMPILED,
  replaceInEditor,
  scriptHeader,
  waitForEditorText,
} from "./editor";
import { launchExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

test("script: name, dirty state and status in the header", async ({ page }) => {
  logBrowserErrors(page);
  const header = scriptHeader(page);
  const compile = () => page.getByRole("button", { name: "Compile" }).click();

  await test.step("a built-in script", async () => {
    await page.goto("/scripts/counter-contract");
    await expect(header.name).toHaveText("counter-contract");
    await expect(header.status).toHaveText("Compiled");
    await expect(header.dirty).toHaveCount(0);
  });

  await test.step("an example's script: its name, not its UUID", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await page.getByRole("link", { name: "counter-account" }).click();
    await expect(page).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/);
    await waitForEditorText(page, "fn get_count(&self) -> Felt {");
    await expect(header.name).toHaveText("counter-account");
    await expect(header.status).toHaveText("Compiled");
    await expect(header.dirty).toHaveCount(0);
  });

  await test.step("an edit makes it a draft", async () => {
    await replaceInEditor(
      page,
      "self.count_map.get(key)\n    }",
      "self.count_map.get(missing_key)\n    }",
    );
    await expect(header.status).toHaveText("Draft");
    await expect(header.dirty).toBeVisible();
  });

  await test.step("a failed compile", async () => {
    await compile();
    await expect(header.status).toHaveText("Error", {
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(header.dirty).toHaveCount(0);
  });

  await test.step("a successful compile", async () => {
    await replaceInEditor(
      page,
      "self.count_map.get(missing_key)",
      "self.count_map.get(key)",
    );
    await expect(header.dirty).toBeVisible();
    await compile();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(header.status).toHaveText("Compiled");
    await expect(header.dirty).toHaveCount(0);
  });
});
