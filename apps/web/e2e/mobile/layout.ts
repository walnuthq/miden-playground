import { expect, type Locator, type Page } from "@playwright/test";
import { tutorialPanel } from "../tutorial";

// The screen's width: the device's viewport. Not `window.innerWidth`, which a
// phone browser widens to the page's width when it zooms a too-wide page out:
// measured against it, a page never overflows.
const screenWidth = (page: Page) => {
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("the mobile projects set a viewport");
  }
  return viewport.width;
};

// Nothing wider than the screen: a phone browser would zoom the whole page out
// to fit it (the header once made a 390 px screen 420 px wide, and a wallet
// tutorial's a 320 px one 362 px wide).
export const expectNoHorizontalOverflow = (page: Page) =>
  expect
    .poll(
      async () =>
        (await page.evaluate(() => document.documentElement.scrollWidth)) -
        screenWidth(page),
      { message: "the page is wider than the screen" },
    )
    .toBeLessThanOrEqual(0);

// The element lies within the screen's width, and within every container that
// clips it (a table's scroll container): not pushed off a right edge by a
// wider table or row, where it would only show once scrolled sideways.
export const expectWithinWidth = async (locator: Locator) => {
  await expect(locator).toBeVisible();
  const width = screenWidth(locator.page());
  await expect
    .poll(
      () =>
        locator.evaluate((element, width) => {
          const { left, right } = element.getBoundingClientRect();
          if (left < 0 || right > width + 1) {
            return false;
          }
          for (
            let ancestor = element.parentElement;
            ancestor;
            ancestor = ancestor.parentElement
          ) {
            if (getComputedStyle(ancestor).overflowX !== "visible") {
              const box = ancestor.getBoundingClientRect();
              if (left < box.left - 1 || right > box.right + 1) {
                return false;
              }
            }
          }
          return true;
        }, width),
      { message: "the element is off the screen's or its container's edge" },
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

// Closes the tutorial panel to its bar, which names the step.
export const closePanel = async (page: Page, step: number) => {
  const panel = tutorialPanel(page);
  await panel.root.getByRole("button", { name: "Close tutorial" }).click();
  const bar = page.getByRole("button", { name: "Open tutorial" });
  await expect(bar).toBeVisible();
  await expect(bar).toContainText(new RegExp(`Step ${step} of \\d+`));
};

// Runs `check` with the page at a 320 px phone's size, then restores it: for
// what only the desktop specs reach (a dialog that needs Bread Wallet, which
// the mobile projects don't load). The app lays out for a phone by width
// alone (`useIsMobile`), so the page switches layouts as it would on one.
// A fixed dialog's boxes are the screen's whatever the page's scroll: in a
// desktop spec resized to a phone, what only a desktop browser has (toasts
// shown before the resize keep their desktop place, the header's Bread Wallet
// button, which a phone never shows) can widen and scroll the page, which
// `expectWithinWidth`'s ancestor checks would count against the dialog.
export const expectWithinDialog = async (locator: Locator, dialog: Locator) => {
  await expect(locator).toBeVisible();
  const width = screenWidth(locator.page());
  const box = async (target: Locator) => {
    const rect = await target.boundingBox();
    if (!rect) {
      throw new Error("no box");
    }
    return rect;
  };
  await expect
    .poll(
      async () => {
        const outer = await box(dialog);
        const inner = await box(locator);
        return (
          outer.x >= 0 &&
          outer.x + outer.width <= width + 1 &&
          inner.x >= outer.x - 1 &&
          inner.x + inner.width <= outer.x + outer.width + 1
        );
      },
      { message: "the element is off its dialog's or the screen's edge" },
    )
    .toBe(true);
};

// Runs `check` with the page at a 320 px phone's size, then restores it: for
// what only the desktop specs reach (a dialog that needs Bread Wallet, which
// the mobile projects don't load). The app lays out for a phone by width
// alone (`useIsMobile`), so the page switches layouts as it would on one.
// Check a dialog there with `expectWithinDialog`.
export const atPhoneWidth = async (page: Page, check: () => Promise<void>) => {
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 740 });
  try {
    await check();
  } finally {
    if (viewport) {
      await page.setViewportSize(viewport);
    }
  }
};
