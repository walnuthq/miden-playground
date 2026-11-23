import { expect, type Page, test } from "@playwright/test";
import {
  componentRow,
  invoke,
  invokeAndSubmit,
  launchExample,
} from "./example";
import {
  atPhoneWidth,
  expectNoHorizontalOverflow,
  expectWithinDialog,
  expectWithinWidth,
} from "./mobile/layout";
import { clickProjectsItem } from "./projects-menu";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
// A script id no one has: listed as deleted.
const DELETED_ID = "00000000-0000-4000-8000-000000000000";

const expectCount = async (page: Page, count: number) => {
  const result = componentRow(page, "get_count").getByRole("cell").last();
  await expect(async () => {
    await invoke(page, "get_count");
    await expect(result).toHaveText(new RegExp(`^${count}\\s*Invoke$`), {
      timeout: 10_000,
    });
  }).toPass({ timeout: TRANSACTION_TIMEOUT });
};

// The workspace's scripts from the API (UUID ids), as persisted.
const apiScripts = (page: Page) =>
  page.evaluate(() =>
    (
      JSON.parse(localStorage.getItem("state") ?? "{}").scripts as {
        id: string;
        name: string;
      }[]
    ).map(({ id, name }) => ({ id, name })),
  );

test("a project link opens the scripts as copies and imports the accounts", async ({
  page,
  context,
  browser,
}) => {
  logBrowserErrors(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  let address = "";
  let scripts: { id: string; name: string }[] = [];
  let link = "";

  await test.step("the author launches the counter example", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    address = page.url().split("/").at(-1) ?? "";
    scripts = (await apiScripts(page)).filter(({ id }) => UUID.test(id));
    expect(scripts.map(({ name }) => name).sort()).toEqual([
      "counter-account",
      "increment-note",
    ]);
  });

  await test.step("and shares the project", async () => {
    await clickProjectsItem(page, "Share project…");
    const dialog = page.getByRole("dialog", { name: "Share Project" });
    await expect(dialog).toBeVisible();
    for (const { name } of scripts) {
      await expect(dialog.getByText(name, { exact: true })).toBeVisible();
    }
    // The deployed counter is public and on chain: ticked.
    const counter = dialog.getByRole("checkbox", { name: /Counter Contract/ });
    await expect(counter).toBeChecked();
    await expect(counter).toBeEnabled();
    // The faucet every sandbox has isn't offered.
    await expect(dialog.getByRole("checkbox")).toHaveCount(1);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    // On a phone the switcher is in the sidebar's sheet, which closes for
    // the dialog.
    await atPhoneWidth(page, async () => {
      await page
        .locator("header")
        .getByRole("button", { name: "Toggle Sidebar" })
        .click();
      const sidebar = page.locator(
        '[data-sidebar="sidebar"][data-mobile="true"]',
      );
      await sidebar.getByRole("button", { name: /Miden Playground/ }).click();
      await page.getByRole("menuitem", { name: "Projects" }).click();
      await page.getByRole("menuitem", { name: "Share project…" }).click();
      await expect(sidebar).toBeHidden();
      const phoneDialog = page.getByRole("dialog", { name: "Share Project" });
      await expectWithinDialog(
        phoneDialog.getByRole("button", { name: "Copy link" }),
        phoneDialog,
      );
      await expectWithinDialog(phoneDialog.getByText(address), phoneDialog);
      await phoneDialog.getByRole("button", { name: "Cancel" }).click();
    });
    await clickProjectsItem(page, "Share project…");
    const desktopDialog = page.getByRole("dialog", { name: "Share Project" });
    await desktopDialog.getByLabel("Title").fill("Counter: a demo & more");
    await desktopDialog.getByRole("button", { name: "Copy link" }).click();
    await expect(page.getByText("Link copied.")).toBeVisible();
    await expect(desktopDialog).toBeHidden();
    link = await page.evaluate(() => navigator.clipboard.readText());
    const url = new URL(link);
    expect(url.pathname).toBe("/open");
    expect(url.hash).toContain(`${address}`);
  });

  // With a deleted script and a Mainnet address added, which the page leaves
  // out.
  const fragment = new URL(link).hash
    .slice(1)
    .replace(/&s=([^&]*)/, `&s=$1,${DELETED_ID}`)
    .concat(",other:mm1arnfum9xuwwlrvgvrefejwvlavn3vk24");
  // Another browser: its own state and its own owner token.
  const readerContext = await browser.newContext();
  const reader = await readerContext.newPage();
  logBrowserErrors(reader);

  await test.step("the reader sees what the link holds", async () => {
    await reader.goto(`/open#${fragment}`);
    await expect(reader.getByText("Counter: a demo & more")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    for (const name of ["counter-account", "increment-note"]) {
      await expect(reader.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(reader.getByText("A script that was deleted")).toBeVisible();
    await expect(
      reader.getByText("1 account isn't a Testnet address: left out."),
    ).toBeVisible();
    await expect(reader.getByText(address)).toBeVisible();
    const open = reader.getByRole("button", { name: "Open project" });
    await expect(open).toBeEnabled();
    await atPhoneWidth(reader, async () => {
      await expectWithinWidth(reader.getByText(address));
      await expectWithinWidth(open);
      await expectNoHorizontalOverflow(reader);
    });
  });

  await test.step("opening it imports the account, with the copies as its components", async () => {
    await reader.getByRole("button", { name: "Open project" }).click();
    await expect(reader).toHaveURL(/\/accounts$/, {
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(
      reader.getByText("Counter: a demo & more opened."),
    ).toBeVisible();
    const row = reader.getByRole("cell", {
      name: "Counter Contract",
      exact: true,
    });
    await expect(row).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    // The copies, not the author's scripts.
    const copies = (await apiScripts(reader)).filter(({ id }) => UUID.test(id));
    expect(copies.map(({ name }) => name).sort()).toEqual([
      "counter-account",
      "increment-note",
    ]);
    for (const { id } of copies) {
      expect(scripts.map((script) => script.id)).not.toContain(id);
    }
    await row.click();
    await expect(reader).toHaveURL(new RegExp(`/accounts/${address}$`));
    await reader.getByRole("tab", { name: "Components" }).click();
    await expect(
      componentRow(reader, "counter_account::counter_contract::count_map"),
    ).toBeVisible();
  });

  await test.step("the reader increments the author's counter", async () => {
    await expectCount(reader, 0);
    await invokeAndSubmit(reader, "increment_count");
    await expect(reader.getByText("Transaction submitted.")).toBeVisible();
    await expectCount(reader, 1);
  });

  await readerContext.close();
});

test("a link that can't be opened says why", async ({ page }) => {
  await page.goto(`/open#v=2&n=mtst&s=${DELETED_ID}`);
  await expect(page.getByText("This project link can't be opened")).toBeVisible(
    { timeout: TRANSACTION_TIMEOUT },
  );
  await expect(page.getByText(/newer version of the playground/)).toBeVisible();
  await page.goto(`/open#v=1&n=mtst&s=${DELETED_ID}`);
  await expect(
    page.getByText(
      "Every script of this link was deleted: there's nothing to open.",
    ),
  ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
  await expect(
    page.getByRole("button", { name: "Open project" }),
  ).toBeDisabled();
});
