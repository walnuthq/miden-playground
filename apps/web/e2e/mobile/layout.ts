import { expect, type Locator, type Page } from "@playwright/test";

// Nothing wider than the screen: a phone browser would zoom the whole page out
// to fit it (the header once made a 390 px screen 420 px wide).
export const expectNoHorizontalOverflow = (page: Page) =>
  expect
    .poll(
      () =>
        page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        ),
      { message: "the page is wider than the screen" },
    )
    .toBeLessThanOrEqual(0);

// The element lies within the screen's width: not pushed off its right edge by
// a wider table or row, where it would only show once scrolled sideways.
export const expectWithinWidth = async (locator: Locator) => {
  await expect(locator).toBeVisible();
  await expect
    .poll(
      async () => {
        const box = await locator.boundingBox();
        const width = await locator.page().evaluate(() => window.innerWidth);
        return box !== null && box.x >= 0 && box.x + box.width <= width + 1;
      },
      { message: "the element is off the screen's right edge" },
    )
    .toBe(true);
};

// The header's last button (the wallet or tutorial toggle) is on screen: the
// header row doesn't overflow.
export const expectHeaderFits = (page: Page) =>
  expectWithinWidth(page.locator("header button").last());

// The sidebar is a sheet on a phone: opens it and follows one of its links,
// which closes it.
export const navigateWithSidebar = async (
  page: Page,
  title: string,
  url: RegExp,
) => {
  await page
    .locator("header")
    .getByRole("button", { name: "Toggle Sidebar" })
    .click();
  const sidebar = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  await sidebar.getByRole("link", { name: title, exact: true }).click();
  await expect(page).toHaveURL(url);
  await expect(sidebar).toBeHidden();
};
