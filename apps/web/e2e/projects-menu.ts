import { expect, type Page } from "@playwright/test";
import { TRANSACTION_TIMEOUT } from "./tutorial";

// The sidebar's project switcher: its button names the workspace (the saved
// project's name, the example's title, or "<Network> sandbox").
export const switcher = (page: Page) =>
  page
    .locator('[data-sidebar="sidebar"]')
    .getByRole("button", { name: /Miden Playground/ });

export const networkBadge = (page: Page) =>
  page.locator('header [data-slot="badge"]');

// The Projects submenu, named after its trigger. Found by name, not as the
// last menu opened: another submenu (Tutorials, Examples) can take its place
// under the pointer.
const projectsMenu = (page: Page) =>
  page.getByRole("menu", { name: "Projects", exact: true });

// Opens the Projects submenu and returns it. A submenu can close or switch
// between the trigger's click and the check (seen on prod under 4 workers:
// Tutorials opened instead), so a miss opens it again.
export const openProjectsMenu = async (page: Page) => {
  // The app shell's switcher, shown while the client initializes, has no
  // menu: wait for the live badge (a block height) first.
  await expect(networkBadge(page)).toContainText(/#\d+/, {
    timeout: TRANSACTION_TIMEOUT,
  });
  const menu = projectsMenu(page);
  await expect(async () => {
    if (await menu.isVisible()) return;
    if ((await page.getByRole("menu").count()) === 0) {
      await switcher(page).click({ timeout: 5_000 });
    }
    await page
      .getByRole("menuitem", { name: "Projects", exact: true })
      .click({ timeout: 5_000 });
    await expect(menu).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  return menu;
};

// Clicks `name` in the Projects submenu. The item can be detached mid-click
// when the submenu switches; the click then never lands, so trying again
// from a reopened submenu can't act twice.
export const clickProjectsItem = async (page: Page, name: string) => {
  await expect(async () => {
    const menu = await openProjectsMenu(page);
    await menu
      .getByRole("menuitem", { name, exact: true })
      .click({ timeout: 5_000 });
  }).toPass({ timeout: 60_000 });
};

export const closeMenu = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
};
