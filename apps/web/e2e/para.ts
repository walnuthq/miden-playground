import { expect, type Page } from "@playwright/test";
import { test } from "./bread";
import { TRANSACTION_TIMEOUT } from "./tutorial";

// Para Wallet, logged in with a Para test account: in Para's BETA environment
// (used by local dev), emails ending in @test.getpara.com accept any
// verification code, so no inbox is needed. Production uses Para's PROD
// environment, where test accounts don't exist: tests using Para are skipped
// there (see skipUnlessParaBeta).
//
// - PARA_EMAIL (optional): the test account, `playground-e2e@test.getpara.com`
//   by default. BETA allows 50 users per API key, so tests reuse one account
//   rather than creating one per run: its Para Wallet keeps its notes and
//   balance between runs.
// https://docs.getpara.com/v3/react/testing-guide
export const PARA_EMAIL =
  process.env.PARA_EMAIL ?? "playground-e2e@test.getpara.com";
const PARA_TEST_CODE = "123456";

const PARA_TIMEOUT = 60_000;

// Para preloads its portal in an iframe, whose host tells the environment.
export const skipUnlessParaBeta = async (page: Page) => {
  const paraFrame = () =>
    page.frames().find((frame) => frame.url().includes("getpara.com"));
  await expect.poll(() => !!paraFrame(), { timeout: PARA_TIMEOUT }).toBe(true);
  test.skip(
    !new URL(paraFrame()!.url()).host.includes(".beta."),
    "Para test accounts only exist in Para's BETA environment",
  );
};

export const para = (page: Page) => {
  // Shows the Para Wallet's EVM address once connected.
  const connected = page.getByRole("button", { name: /^Para Logo/ });

  // Connects Para Wallet from the header's "Select Wallet" menu.
  const login = async () => {
    await page.getByRole("button", { name: "Select Wallet" }).click();
    await page.getByRole("menuitem", { name: "Para Wallet" }).click();
    const modal = page.getByRole("dialog", { name: /Authentication Modal/ });
    const email = modal.getByRole("textbox", { name: "Enter email or phone" });
    await email.fill(PARA_EMAIL);
    // Para can move on as soon as the address is filled.
    await page.keyboard.press("Enter");
    await expect(email).toBeHidden({ timeout: PARA_TIMEOUT });
    // The verification code boxes are out of reach of locators (closed shadow
    // root), but the first one gets focus: type into it, and type again if
    // the code didn't go through (e.g. typed before the boxes were ready).
    await expect(async () => {
      for (let i = 0; i < PARA_TEST_CODE.length; i++) {
        await page.keyboard.press("Backspace");
      }
      await page.keyboard.type(PARA_TEST_CODE, { delay: 50 });
      await expect(connected).toBeVisible({ timeout: 20_000 });
    }).toPass({ intervals: [2_000], timeout: 2 * PARA_TIMEOUT });
    // "Welcome Back!" stays up for a while once connected.
    await expect(modal).toBeHidden({ timeout: PARA_TIMEOUT });
  };

  // Disconnects Para Wallet from its account view (its wallet stays
  // imported).
  const disconnect = async () => {
    const modal = page.getByRole("dialog", { name: /Authentication Modal/ });
    const profile = modal.getByRole("button", { name: "Profile" });
    // Right after logging in, the Para button reopens the modal on its last
    // screen ("Welcome Back!"), which closes by itself: click again.
    await expect(async () => {
      await expect(modal).toBeHidden({ timeout: 10_000 });
      await connected.click();
      await expect(profile).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: PARA_TIMEOUT });
    await profile.click();
    await modal.getByRole("button", { name: "Disconnect" }).click();
    await expect(
      page.getByRole("button", { name: "Select Wallet" }),
    ).toBeVisible({ timeout: PARA_TIMEOUT });
  };

  // Runs `action` and approves the signing modal it opens. USDCx transactions
  // expire about a minute after they're executed: approve right away.
  const approve = async (
    action: () => Promise<unknown>,
    { timeout = TRANSACTION_TIMEOUT }: { timeout?: number } = {},
  ) => {
    await action();
    const modal = page.locator("#para-signing-modal");
    await modal.getByRole("button", { name: "Yes", exact: true }).click({
      timeout,
    });
    await expect(modal).toBeHidden();
  };

  return { connected, login, disconnect, approve };
};
