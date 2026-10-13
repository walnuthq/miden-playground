import { randomBytes } from "node:crypto";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  test as base,
  expect,
  type BrowserContext,
  type BrowserType,
  type Page,
} from "@playwright/test";

// Bread Wallet (Miden's browser extension) for tutorials that sign with a
// connected wallet. Extensions only load in Playwright's own Chromium, in a
// persistent context, so these tests launch their own browser.
//
// - BREAD_EXTENSION_DIR (required): the unpacked extension, i.e. the
//   `MidenWallet.<version>.Testnet.zip` asset of
//   https://github.com/0xMiden/wallet/releases. Tests using this fixture are
//   skipped without it.
// - By default, each test onboards a brand new Bread wallet, like a new
//   Playground user. It has no funds: tutorials mint what they need.
// - BREAD_PROFILE_DIR and BREAD_PASSWORD (optional): run on a copy of a
//   Chromium profile where Bread has already been onboarded, e.g. to reuse a
//   funded wallet. The profile must come from Playwright's Chromium: Chrome
//   and Chromium builds can store the extension's IndexedDB differently, and
//   Bread then starts with an empty account database. The extension ID is
//   derived from BREAD_EXTENSION_DIR's path, so it must also be the folder the
//   profile was onboarded with.

const POPUP_TIMEOUT = 60_000;

const isConfirmPopup = (page: Page) => page.url().includes("/confirm.html");

export type Bread = {
  // Bread's full page, kept open for the whole test: Bread syncs (and
  // auto-consumes received notes) from its UI, not from its service worker.
  walletPage: Page;
  // Connects Bread to the Playground from the header's "Select Wallet"
  // button, approving the connection request if the site isn't already
  // authorized.
  connect: (page: Page) => Promise<void>;
  // Disconnects Bread from the Playground (its wallet stays imported).
  disconnect: (page: Page) => Promise<void>;
  // Runs `action`, waits for the Bread popup it opens and clicks `button`.
  // Returns the popup text, e.g. to check what's being signed.
  approve: (
    action: () => Promise<unknown>,
    options?: { button?: string; timeout?: number },
  ) => Promise<string>;
};

type BreadProfile = { userDataDir: string; password: string };

const breadConfig = () => {
  const {
    BREAD_EXTENSION_DIR: extensionDir,
    BREAD_PROFILE_DIR: profileDir,
    BREAD_PASSWORD: password,
  } = process.env;
  if (!extensionDir) {
    return null;
  }
  return profileDir && password
    ? { extensionDir, profile: { dir: profileDir, password } }
    : { extensionDir, profile: null };
};

const launch = (
  chromium: BrowserType,
  userDataDir: string,
  extensionDir: string,
  options: { baseURL?: string; viewport?: { width: number; height: number } },
) =>
  chromium.launchPersistentContext(userDataDir, {
    ...options,
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
    ],
  });

const openWalletPage = async (context: BrowserContext) => {
  const worker =
    context
      .serviceWorkers()
      .find((worker) => worker.url().startsWith("chrome-extension://")) ??
    (await context.waitForEvent("serviceworker"));
  const url = `chrome-extension://${new URL(worker.url()).host}/fullpage.html`;
  // On a new profile, Bread opens its welcome page by itself.
  const page =
    context.pages().find((page) => page.url().startsWith(url)) ??
    (await context.newPage());
  if (!page.url().startsWith(url)) {
    await page.goto(url);
  }
  return page;
};

// Creates a wallet with a Guardian-backed private account (the default) and
// returns its password.
const onboard = async (context: BrowserContext) => {
  const walletPage = await openWalletPage(context);
  const button = (name: string | RegExp) =>
    walletPage.getByRole("button", { name, exact: typeof name === "string" });
  const password = `e2e-${randomBytes(12).toString("hex")}-1`;
  await expect(button("Get started")).toBeVisible({ timeout: POPUP_TIMEOUT });
  // "Pin Bread" hint, shown over the welcome page.
  if (await button("Got it").isVisible()) {
    await button("Got it").click();
  }
  await button("Get started").click();
  // Testnet warning.
  await button("I understand").click();
  await walletPage
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(password);
  await walletPage
    .getByRole("textbox", { name: "Verify password" })
    .fill(password);
  await button("Continue").click();
  // "Meet your Guardian", then "Choose your Guardian": take the suggested
  // provider. It varies, and providers that are offline can't be picked.
  await button("Continue").click();
  await button(/^Continue with /).click();
  // Usage data.
  await button("Not now").click();
  // "Open wallet" closes the onboarding tab once the account is created.
  const closed = walletPage.waitForEvent("close");
  await button("Open wallet").click({ timeout: POPUP_TIMEOUT });
  await closed;
  return password;
};

// The full page is also where the wallet gets unlocked: a popup that has to
// unlock first closes without handling its request.
const unlock = async (context: BrowserContext, password: string) => {
  const walletPage = await openWalletPage(context);
  await walletPage.locator("input[type=password]").fill(password);
  await walletPage.getByRole("button", { name: "Unlock" }).click();
  await expect(walletPage.getByText("Total balance")).toBeVisible({
    timeout: POPUP_TIMEOUT,
  });
  return walletPage;
};

export const test = base.extend<{ breadProfile: BreadProfile; bread: Bread }>({
  // The profile the test's browser runs on: a fresh copy, deleted afterwards.
  breadProfile: async ({ playwright }, use, testInfo) => {
    const config = breadConfig();
    testInfo.skip(
      !config,
      "Set BREAD_EXTENSION_DIR to run Bread Wallet tests (see e2e/bread.ts)",
    );
    const { extensionDir, profile } = config!;
    const userDataDir = await mkdtemp(path.join(tmpdir(), "bread-profile-"));
    try {
      if (profile) {
        await cp(profile.dir, userDataDir, {
          recursive: true,
          // Chromium's lock files would make the copy look in use.
          filter: (source) => !path.basename(source).startsWith("Singleton"),
        });
        await use({ userDataDir, password: profile.password });
      } else {
        // Dapp requests made in the browser session that onboarded the
        // wallet are never answered: onboard in a browser of its own, and
        // run the test in the next one.
        const context = await launch(
          playwright.chromium,
          userDataDir,
          extensionDir,
          {},
        );
        const password = await onboard(context);
        await context.close();
        await use({ userDataDir, password });
      }
    } finally {
      await rm(userDataDir, { recursive: true, force: true });
    }
  },
  context: async ({ playwright, baseURL, viewport, breadProfile }, use) => {
    const context = await launch(
      playwright.chromium,
      breadProfile.userDataDir,
      breadConfig()!.extensionDir,
      { baseURL, viewport: viewport ?? undefined },
    );
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    // Reuse the blank tab the persistent context opens with.
    const blank = context.pages().find((page) => page.url() === "about:blank");
    await use(blank ?? (await context.newPage()));
  },
  bread: async ({ context, breadProfile }, use) => {
    const walletPage = await unlock(context, breadProfile.password);

    const approve: Bread["approve"] = async (
      action,
      { button = "Confirm", timeout = POPUP_TIMEOUT } = {},
    ) => {
      const popupPromise = context.waitForEvent("page", {
        predicate: isConfirmPopup,
        timeout,
      });
      await action();
      const popup = await popupPromise;
      const approveButton = popup.getByRole("button", {
        name: button,
        exact: true,
      });
      await expect(approveButton).toBeEnabled({ timeout });
      const text = await popup.locator("body").innerText();
      await approveButton.click();
      // Bread closes its popup once the request is handled, but headless
      // windows can stay open, blank: wait for either, then close it.
      await Promise.race([
        popup.waitForEvent("close", { timeout }),
        expect(approveButton).toBeHidden({ timeout }),
      ]).catch((error) => {
        if (!popup.isClosed()) {
          throw error;
        }
      });
      if (!popup.isClosed()) {
        await popup.close();
      }
      return text;
    };

    const connect: Bread["connect"] = async (page) => {
      const connected = page.getByRole("button", { name: /Bread Wallet icon/ });
      // Without the injected provider, the Playground offers to install Bread.
      await page.waitForFunction(() => "midenWallet" in window, null, {
        timeout: POPUP_TIMEOUT,
      });
      const popupPromise = context
        .waitForEvent("page", { predicate: isConfirmPopup, timeout: 15_000 })
        .catch(() => null);
      const selectWallet = page.getByRole("button", { name: "Select Wallet" });
      // A menu when several wallets are offered (e.g. Bread and Para).
      const hasMenu =
        (await selectWallet.getAttribute("aria-haspopup")) === "menu";
      await selectWallet.click();
      if (hasMenu) {
        await page.getByRole("menuitem", { name: "Bread Wallet" }).click();
      }
      // An already authorized site is connected without a popup.
      const popup = await Promise.race([
        popupPromise,
        connected
          .waitFor({ timeout: 15_000 })
          .then(() => null)
          .catch(() => null),
      ]);
      if (popup) {
        // "I understand the risk" is often unchecked, and Connect then fails.
        // It's a visually hidden input under a custom box: click it directly.
        const risk = popup.getByRole("checkbox");
        await risk.waitFor({ timeout: POPUP_TIMEOUT });
        if (!(await risk.isChecked())) {
          await risk.dispatchEvent("click");
        }
        await expect(risk).toBeChecked();
        await popup
          .getByRole("button", { name: "Connect", exact: true })
          .click();
        await popup.waitForEvent("close", { timeout: POPUP_TIMEOUT });
      }
      await expect(connected).toBeVisible({ timeout: POPUP_TIMEOUT });
    };

    const disconnect: Bread["disconnect"] = async (page) => {
      await page.getByRole("button", { name: /Bread Wallet icon/ }).click();
      await page.getByRole("menuitem", { name: "Disconnect" }).click();
      await expect(
        page.getByRole("button", { name: "Select Wallet" }),
      ).toBeVisible();
    };

    await use({ walletPage, connect, disconnect, approve });
  },
});

export { expect };
