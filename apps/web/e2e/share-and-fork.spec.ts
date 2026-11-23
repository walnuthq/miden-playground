import { expect, type Page, test } from "@playwright/test";
import { COMPILED, createCounterScript, scriptHeader } from "./editor";
import {
  atPhoneWidth,
  expectNoHorizontalOverflow,
  expectWithinWidth,
} from "./mobile/layout";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

const BANNER = "You're viewing a shared script.";

const compileButton = (page: Page) =>
  page.getByRole("button", { name: "Compile" });

const compile = async (page: Page) => {
  await compileButton(page).click();
  await expect(page.getByText(COMPILED).last()).toBeVisible({
    timeout: TRANSACTION_TIMEOUT,
  });
};

const clipboard = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText());

test("a shared script opens read-only, and a fork is the visitor's own", async ({
  page,
  context,
  browser,
}) => {
  logBrowserErrors(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  let link = "";

  await test.step("the owner shares a draft from the script page", async () => {
    await createCounterScript(page);
    await expect(page.getByText(BANNER)).toHaveCount(0);
    await page.getByRole("button", { name: "Share", exact: true }).click();
    await expect(page.getByText("Link copied.")).toBeVisible();
    await expect(
      page.getByText("compile to share your latest changes"),
    ).toBeVisible();
    link = await clipboard(page);
    expect(link).toBe(page.url());
  });

  await test.step("and from the scripts table, once compiled", async () => {
    await compile(page);
    await page.goto("/scripts");
    await page
      .getByRole("row", { name: /counter-account/ })
      .getByRole("button", { name: "Open menu" })
      .click();
    await page.evaluate(() => navigator.clipboard.writeText(""));
    await page.getByRole("menuitem", { name: "Share script" }).click();
    await expect(page.getByText("Link copied.").last()).toBeVisible();
    await expect.poll(() => clipboard(page)).toBe(link);
  });

  const id = link.split("/").at(-1) ?? "";
  // Another browser: its own state and its own owner token.
  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  logBrowserErrors(visitor);
  // The app's request for the script: the API's URL, with the visitor's token.
  const scriptRequest = visitor.waitForRequest(
    (request) =>
      request.resourceType() === "fetch" &&
      request.method() === "GET" &&
      request.url().endsWith(`/scripts/${id}`),
  );

  await test.step("the visitor gets it read-only", async () => {
    await visitor.goto(link);
    await expect(visitor.getByText(BANNER)).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(scriptHeader(visitor).name).toHaveText("counter-account");
    await expect(scriptHeader(visitor).status).toHaveText("Compiled");
    await expect(compileButton(visitor)).toHaveCount(0);
    await visitor.getByRole("tab", { name: "Manifest" }).click();
    await expect(
      visitor.getByRole("heading", { name: "Package dependencies" }),
    ).toBeVisible();
    await expect(
      visitor.getByRole("button", { name: "Add dependency" }),
    ).toHaveCount(0);
    await visitor.getByRole("tab", { name: "Explorer" }).click();
  });

  await test.step("the API refuses the visitor's writes", async () => {
    const request = await scriptRequest;
    const headers = {
      Authorization: (await request.allHeaders()).authorization ?? "",
    };
    expect(headers.Authorization).toMatch(/^Bearer [0-9a-f]{64}$/);
    // The compile route is rate-limited before it looks at the owner: a
    // local run on several workers can get a 429 first.
    await expect
      .poll(
        async () => {
          const compiled = await visitor.request.patch(request.url(), {
            headers,
            data: {
              files: { "src/lib.rs": "// overwritten" },
              dependencies: [],
            },
          });
          return compiled.status();
        },
        { timeout: 120_000, intervals: [15_000] },
      )
      .toBe(403);
    const deleted = await visitor.request.delete(request.url(), { headers });
    expect(deleted.status()).toBe(403);
    // Nor without a token.
    const anonymous = await visitor.request.delete(request.url());
    expect(anonymous.status()).toBe(403);
  });

  await test.step("the banner fits a 320 px phone", async () => {
    await atPhoneWidth(visitor, async () => {
      await expectWithinWidth(visitor.getByRole("button", { name: "Fork" }));
      await expectWithinWidth(
        visitor.getByRole("button", { name: "Share", exact: true }),
      );
      await expectNoHorizontalOverflow(visitor);
    });
  });

  await test.step("a fork is a copy the visitor can compile", async () => {
    await visitor.getByRole("button", { name: "Fork" }).click();
    await expect(visitor.getByText("counter-account forked.")).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(visitor).not.toHaveURL(link);
    await expect(visitor).toHaveURL(/\/scripts\/[0-9a-f-]{36}$/);
    await expect(visitor.getByText(BANNER)).toHaveCount(0);
    await expect(scriptHeader(visitor).status).toHaveText("Compiled");
    await compile(visitor);
    await visitor.goto("/scripts");
    await expect(
      visitor.getByRole("row", { name: /counter-account/ }),
    ).toHaveCount(1);
  });

  await test.step("the owner's script is still theirs", async () => {
    await page.goto(link);
    await expect(compileButton(page)).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    await expect(page.getByText(BANNER)).toHaveCount(0);
    await compile(page);
  });

  await visitorContext.close();
});
