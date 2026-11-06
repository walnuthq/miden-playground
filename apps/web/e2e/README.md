# End-to-end tests

Playwright tests for the tutorials, the examples, the script editor (`script-*.spec.ts`: header, Explorer, diagnostics, console layout, shortcuts, MASM highlighting, editor settings) and the phone layout (`mobile/`). They run against a live Playground on testnet, so transactions are proven and submitted for real: expect minutes per test. Spec files run in parallel on 4 workers, about 8 minutes for the suite, or 28 with `--workers=1`. Testnet's prover and RPC time out now and then, so a failing test gets one retry, and one that passes on it is reported as flaky. See `playwright.config.ts` for why 4, and what specs can share.

## Prerequisites

1. Install Playwright's browsers once: `pnpm exec playwright install chromium webkit` (WebKit for the iPhone project).
2. Start the Playground (`pnpm dev` in `apps/web`, port 3000), unless you set `PLAYWRIGHT_BASE_URL`.
3. For the specs that create scripts on the API, start `apps/api` too (`pnpm dev` in `apps/api`, port 3001), with its Docker services up. The two examples only need postgres: their packages come precompiled (`apps/api/examples`). Tutorials 11 and 12 and the script editor specs compile, so they also need the compile service. Tutorials 7 and 8 compile through local mocks in `apps/web/lib/mock-api.ts` and don't need it.
4. For the specs that use Bread Wallet, install it from the repo root with `pnpm bread-wallet`. It downloads the version pinned in `.bread-wallet/version` to `.bread-wallet/extension` (gitignored). Each run warns when it's missing or outdated. `pnpm bread-wallet latest` upgrades to the newest [wallet release](https://github.com/0xMiden/wallet/releases) and pins it: commit `.bread-wallet/version`.

## Environment variables

| Variable                              | Required | Description                                                                                                                                                                                                     |
| ------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BREAD_EXTENSION_DIR`                 | No       | Absolute path to an unpacked Bread Wallet extension, instead of `.bread-wallet/extension`.                                                                                                                      |
| `BREAD_PROFILE_DIR`, `BREAD_PASSWORD` | No       | Run on a copy of a Chromium profile where Bread is already onboarded (e.g. a funded wallet) instead of onboarding a new wallet per test. The profile must come from Playwright's Chromium.                      |
| `BREAD_PROFILE_IN_PLACE`              | No       | `1`: run on the `BREAD_PROFILE_DIR` profile itself, not a copy. Needed for a wallet on a real chain (Mainnet), whose state must persist across runs. Tests sharing it can't run in parallel: add `--workers=1`. |
| `PARA_EMAIL`                          | No       | Para test account for tutorial 4 (default `playground-e2e@test.getpara.com`).                                                                                                                                   |
| `PLAYWRIGHT_BASE_URL`                 | No       | Deployment to test (default `http://localhost:3000`).                                                                                                                                                           |

**Specs using Bread Wallet are skipped, not failed, when Bread Wallet isn't installed.** A run that reports `skipped` didn't test anything. These specs are tutorials 3, 4, 5, 8, 9 and 11, and the Miden Bank example.

Para test accounts only exist in Para's BETA environment (local dev), so tutorial 4 is also skipped against production.

## Running

```sh
pnpm bread-wallet                              # from the repo root
cd apps/web
pnpm test:e2e                                  # all specs
pnpm test:e2e e2e/example-miden-bank.spec.ts   # one spec
pnpm test:e2e --project=chromium               # desktop specs only
pnpm test:e2e --project=mobile-safari          # phone specs on WebKit (iPhone 14)
```

## Mobile

The specs in `mobile/` run in two phone projects: `mobile-safari` (iPhone 14, WebKit, 390 px wide) and `mobile-chrome` (Pixel 7, Chromium, 412 px). `mobile-small` (Galaxy S9+, Chromium, 320 px) runs `mobile-sandbox.spec.ts`, for the narrowest phones. The `chromium` project, at 1440×900, skips them. They check:

- that pages don't overflow the screen's width (a phone would zoom the whole page out);
- that controls a wider layout pushes off-screen stay on it: the header's buttons, the tables' row menus, the procedures' Invoke buttons;
- the sidebar, which closes after navigating;
- the script editor's files menu and its collapsed console;
- the tutorial's bottom panel, which reopens by itself when a step is done;
- the app shell shown while the Miden client starts;
- the read-only code editor, and the tutorial buttons that add the code a step asks for (tutorials 7, 8 and 12, in `mobile-tutorial-code.spec.ts`).

`mobile-sandbox.spec.ts` launches the counter example, so it needs `apps/api`, and compiles a script, so it needs the compile service too, as does tutorial 12 in `mobile-tutorial-code.spec.ts`. Headless WebKit starts the client in a couple of seconds against a local server, but takes about 30 s against production, where it downloads the WASM.

## Mainnet

`mainnet-network-counter.spec.ts` runs on Miden Partner Mainnet with real funds. It's skipped unless `MAINNET_E2E=1` is set with an in-place Bread profile, so `pnpm test:e2e` never runs it. It creates a Mainnet sandbox and connects Bread. Then it deploys a network counter (the sandbox's built-in "Counter Account" component, with `increment-note` allowed), funded with 0.001 USDCX from Bread, and increments it with a network note sent from Bread. It checks that the counter's balance didn't drop, which shows the note's fee sponsorship paid for the network transaction. Each run costs the wallet about 0.0015 USDCX.

```sh
MAINNET_E2E=1 BREAD_PROFILE_IN_PLACE=1 \
BREAD_PROFILE_DIR="$PWD/../../.bread-wallet/profiles/mainnet" \
BREAD_PASSWORD="$(cat ../../.bread-wallet/profiles/mainnet.password)" \
pnpm test:e2e e2e/mainnet-network-counter.spec.ts --workers=1
```

The profile is a Bread wallet onboarded on Mainnet with an invite code, from Playwright's Chromium (gitignored, like the rest of `.bread-wallet/`). The spec stops before spending anything when the wallet has less than 0.002 USDCX. To top it up, run `BREAD_INVITE_CODE=<code> pnpm qa-wallet fund`. It onboards a throwaway Bread wallet with the invite code, waits for its 0.01 USDCX funding, sends it all to the QA wallet (about 0.0096 arrives), then deletes the throwaway profile. If it fails midway, the profile is kept in `.bread-wallet/profiles/burner-*`: resume with `pnpm qa-wallet fund --burner <dir>`. `pnpm qa-wallet balance` prints the QA wallet's balance.

`mainnet-switch-warning.spec.ts` runs the same way, on the same wallet, and spends nothing: it never approves Bread's request.

On failure, screenshots, a video and a trace are saved in `test-results/`. Open the trace with `pnpm exec playwright show-trace test-results/<test>/trace.zip`.
