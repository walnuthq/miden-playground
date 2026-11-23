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
  expectWithinWidth,
} from "./mobile/layout";
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
  browser,
}) => {
  logBrowserErrors(page);
  let address = "";
  let scripts: { id: string; name: string }[] = [];

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

  // Built by hand until Share project (spec/project-links.md, PR 4), with a
  // deleted script and a Mainnet address the page leaves out.
  const fragment = [
    "v=1",
    "n=mtst",
    `t=${encodeURIComponent("Counter: a demo & more")}`,
    `s=${[...scripts.map(({ id }) => id), DELETED_ID].join(",")}`,
    `a=${encodeURIComponent("My counter")}:${address},other:mm1arnfum9xuwwlrvgvrefejwvlavn3vk24`,
  ].join("&");
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
    const row = reader.getByRole("cell", { name: "My counter", exact: true });
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
