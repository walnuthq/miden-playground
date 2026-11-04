// Tops up the Mainnet QA Bread wallet (`.bread-wallet/profiles/mainnet`), which
// pays for `e2e/mainnet-network-counter.spec.ts`, with Partner Mainnet invite
// codes. A wallet onboarded with a code receives 0.01 USDCX from the funding
// service: each code onboards a throwaway "burner" wallet, which sends its
// whole balance to the QA wallet.
//
// Usage (in apps/web):
//   pnpm qa-wallet balance              the QA wallet's USDCX balance
//   BREAD_INVITE_CODE=… pnpm qa-wallet fund
//                                       onboards a burner with the code, waits
//                                       for its funding and sends it all to
//                                       the QA wallet
//   pnpm qa-wallet fund --burner <dir>  resumes from a burner profile left by a
//                                       failed run
//
// The code is only read from the environment, never written to disk. A burner
// profile (and its password, next to it) is kept in .bread-wallet/profiles/
// until its funds have reached the QA wallet, then deleted.
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { type BrowserContext, chromium, type Page } from "@playwright/test";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const EXTENSION_DIR = path.join(ROOT, ".bread-wallet/extension");
const PROFILES_DIR = path.join(ROOT, ".bread-wallet/profiles");
const QA_PROFILE_DIR = path.join(PROFILES_DIR, "mainnet");
export const QA_ADDRESS = "mm1apjmkfdxq9fl3stff50cr7u36vnqtwj0_qr7qqq9wr6w";
// Below this, the QA wallet can't pay for one more spec run (~0.0015 USDCX).
export const LOW_BALANCE = 0.002;
const FUNDING_TIMEOUT = 10 * 60_000;

const log = (...args: unknown[]) =>
  console.info(new Date().toISOString().slice(11, 19), ...args);

const launch = (userDataDir: string) =>
  chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: true,
    viewport: { width: 1280, height: 900 },
    args: [
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
      "--screen-info={0,0 2560x1600}",
      "--window-size=1280,900",
    ],
  });

// Bread's full page, where it syncs and auto-consumes received notes.
const openWalletPage = async (context: BrowserContext) => {
  const worker =
    context
      .serviceWorkers()
      .find((worker) => worker.url().startsWith("chrome-extension://")) ??
    (await context.waitForEvent("serviceworker"));
  const url = `chrome-extension://${new URL(worker.url()).host}/fullpage.html`;
  const page =
    context.pages().find((page) => page.url().startsWith(url)) ??
    (await context.newPage());
  if (!page.url().startsWith(url)) {
    await page.goto(url);
  }
  await page.waitForTimeout(3_000);
  return page;
};

const unlock = async (page: Page, password: string) => {
  const input = page.locator("input[type=password]");
  if (await input.isVisible().catch(() => false)) {
    await input.fill(password);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3_000);
  }
};

const button = (page: Page, name: string | RegExp) =>
  page.getByRole("button", { name, exact: typeof name === "string" });

// The USDCX balance on Bread's home page, or null while it isn't shown.
const usdcxBalance = async (page: Page) => {
  const text = await page
    .getByRole("group", { name: "Assets" })
    .getByRole("button", { name: /^USDCX / })
    .textContent({ timeout: 5_000 })
    .catch(() => null);
  const amount = text?.match(/USDCX\s*([\d,]*\.?\d+)\s*USDCX/)?.[1];
  return amount === undefined ? null : Number(amount.replaceAll(",", ""));
};

const waitForBalance = async (
  page: Page,
  done: (balance: number) => boolean,
  timeout = FUNDING_TIMEOUT,
) => {
  const deadline = Date.now() + timeout;
  let balance: number | null = null;
  while (Date.now() < deadline) {
    balance = await usdcxBalance(page);
    if (balance !== null && done(balance)) {
      return balance;
    }
    await page.waitForTimeout(10_000);
  }
  throw new Error(`USDCX balance still ${balance} after ${timeout / 1000} s`);
};

// Onboards a Mainnet wallet with the invite code, keeping the suggested
// Guardian. Returns its address.
const onboard = async (page: Page, code: string, password: string) => {
  if (await button(page, "Got it").isVisible()) {
    await button(page, "Got it").click();
  }
  await button(page, "I have a code").click();
  await page.getByRole("textbox", { name: "Access code" }).fill(code);
  await button(page, "Unlock mainnet").click();
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(password);
  await page.getByRole("textbox", { name: "Verify password" }).fill(password);
  await button(page, "Continue").click();
  // "Meet your Guardian", then "Choose your Guardian".
  await button(page, "Continue").click();
  await button(page, /^Continue with /).click();
  const notNow = button(page, "Not now");
  const openWallet = button(page, "Open wallet");
  await notNow.or(openWallet).waitFor({ timeout: 2 * 60_000 });
  if (await notNow.isVisible()) {
    await notNow.click();
  }
  const closed = page.waitForEvent("close").catch(() => {});
  await openWallet.click({ timeout: 2 * 60_000 });
  await closed;
};

// The full address, from the (hidden) Receive tab's "Receive at" text.
const address = async (page: Page) =>
  (
    await page
      .getByText(/^mm1[0-9a-z]+_[0-9a-z]+$/)
      .first()
      .textContent({ timeout: 30_000 })
  )?.trim() ?? "";

// Runs `action` on the QA wallet's unlocked full page.
const withQaWallet = async <T>(action: (page: Page) => Promise<T>) => {
  const password = (
    await readFile(`${QA_PROFILE_DIR}.password`, "utf8")
  ).trim();
  const context = await launch(QA_PROFILE_DIR);
  try {
    const page = await openWalletPage(context);
    await unlock(page, password);
    // Let Bread sync and consume what it received.
    await page.waitForTimeout(15_000);
    return await action(page);
  } finally {
    await context.close();
  }
};

const balance = () =>
  withQaWallet((page) => waitForBalance(page, () => true, 60_000));

// Sends the burner's whole balance (Bread's "Max", which leaves the fee) to
// the QA wallet, as a note it can claim for 7 days before it comes back.
const sendAll = async (page: Page) => {
  await page.getByRole("tab", { name: "Send" }).click();
  await page
    .getByRole("textbox", { name: "Enter Miden or Ethereum Address" })
    .fill(QA_ADDRESS);
  await button(page, "Continue").click();
  await page.getByRole("heading", { name: "Enter amount" }).waitFor();
  // The Swap tab, rendered too, has its own Max button: the Send tab's is
  // first.
  await button(page, "Max").first().click();
  // Bread fills the field in once it has computed the fee.
  const amountInput = page.getByRole("textbox", { name: "Amount in USDCX" });
  let amount = 0;
  for (let attempt = 0; attempt < 30 && !(amount > 0); attempt += 1) {
    await page.waitForTimeout(1_000);
    amount = Number(await amountInput.inputValue());
  }
  if (!(amount > 0)) {
    throw new Error("Nothing to send");
  }
  await button(page, "Continue").first().click();
  await page.getByRole("heading", { name: "Review Details" }).waitFor();
  await button(page, "Send Payment").click();
  // Bread stays on its progress screen: the balance shows on its home page.
  await page.waitForTimeout(10_000);
  await page.goto(new URL("fullpage.html", page.url()).href);
  return amount;
};
const fund = async (burnerArg: string | undefined) => {
  let burnerDir = burnerArg ? path.resolve(burnerArg) : undefined;
  let password: string;
  if (burnerDir) {
    password = (await readFile(`${burnerDir}.password`, "utf8")).trim();
  } else {
    const code = process.env.BREAD_INVITE_CODE?.trim();
    if (!code) {
      throw new Error("Set BREAD_INVITE_CODE to a Partner Mainnet invite code");
    }
    burnerDir = path.join(
      PROFILES_DIR,
      `burner-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`,
    );
    password = `burner-${randomBytes(12).toString("hex")}-1`;
    await mkdir(PROFILES_DIR, { recursive: true });
    await writeFile(`${burnerDir}.password`, password, { mode: 0o600 });
    log("Onboarding a burner wallet in", burnerDir);
    const context = await launch(burnerDir);
    try {
      await onboard(await openWalletPage(context), code, password);
    } finally {
      await context.close();
    }
  }
  let before = 0;
  const context = await launch(burnerDir);
  try {
    const page = await openWalletPage(context);
    await unlock(page, password);
    log("Burner", await address(page));
    const funded = await waitForBalance(page, (balance) => balance > 0);
    log("Burner funded:", funded, "USDCX");
    before = await balance();
    log("QA wallet before:", before, "USDCX");
    const sent = await sendAll(page);
    log("Sending", sent, "USDCX to the QA wallet");
    // Bread proves and submits the transaction, then the balance drops to
    // what the fee left (dust, not worth sending).
    await waitForBalance(page, (balance) => balance < funded - sent / 2);
    log("Sent");
  } finally {
    await context.close();
  }
  const after = await withQaWallet((page) =>
    waitForBalance(page, (balance) => balance > before),
  );
  log("QA wallet after:", after, "USDCX");
  await rm(burnerDir, { recursive: true, force: true });
  await rm(`${burnerDir}.password`, { force: true });
  log("Burner profile deleted");
};

const [command, ...args] = process.argv.slice(2);
if (command === "balance") {
  const amount = await balance();
  console.info(`QA wallet ${QA_ADDRESS}: ${amount} USDCX`);
  if (amount < LOW_BALANCE) {
    console.info(
      `Below ${LOW_BALANCE} USDCX: top it up with an invite code (pnpm qa-wallet fund).`,
    );
  }
} else if (command === "fund") {
  const burnerIndex = args.indexOf("--burner");
  await fund(burnerIndex === -1 ? undefined : args[burnerIndex + 1]);
} else {
  console.error("Usage: pnpm qa-wallet balance | fund [--burner <dir>]");
  process.exitCode = 1;
}
