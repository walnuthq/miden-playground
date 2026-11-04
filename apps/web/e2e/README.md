# End-to-end tests

Playwright tests for the tutorials, the examples and the script editor (`script-*.spec.ts`: header, Explorer, diagnostics, console layout, shortcuts, MASM highlighting, editor settings). They run against a live Playground on testnet, so transactions are proven and submitted for real: expect minutes per test. Tests run one at a time because they share testnet accounts.

## Prerequisites

1. Install Playwright's Chromium once: `pnpm exec playwright install chromium`.
2. Start the Playground (`pnpm dev` in `apps/web`, port 3000), unless you set `PLAYWRIGHT_BASE_URL`.
3. For the specs that create scripts on the API, start `apps/api` too (`pnpm dev` in `apps/api`, port 3001), with its Docker services up. The two examples only need postgres: their packages come precompiled (`apps/api/examples`). Tutorials 11 and 12 and the script editor specs compile, so they also need the compile service. Tutorials 7 and 8 compile through local mocks in `apps/web/lib/mock-api.ts` and don't need it.
4. For the specs that use Bread Wallet, install it from the repo root with `pnpm bread-wallet`. It downloads the version pinned in `.bread-wallet/version` to `.bread-wallet/extension` (gitignored). Each run warns when it's missing or outdated. `pnpm bread-wallet latest` upgrades to the newest [wallet release](https://github.com/0xMiden/wallet/releases) and pins it: commit `.bread-wallet/version`.

## Environment variables

| Variable                              | Required | Description                                                                                                                                                                                  |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BREAD_EXTENSION_DIR`                 | No       | Absolute path to an unpacked Bread Wallet extension, instead of `.bread-wallet/extension`.                                                                                                   |
| `BREAD_PROFILE_DIR`, `BREAD_PASSWORD` | No       | Run on a copy of a Chromium profile where Bread is already onboarded (e.g. a funded wallet) instead of onboarding a new wallet per test. The profile must come from Playwright's Chromium.   |
| `BREAD_PROFILE_IN_PLACE`              | No       | `1`: run on the `BREAD_PROFILE_DIR` profile itself, not a copy. Needed for a wallet on a real chain (Mainnet), whose state must persist across runs. Tests sharing it can't run in parallel. |
| `PARA_EMAIL`                          | No       | Para test account for tutorial 4 (default `playground-e2e@test.getpara.com`).                                                                                                                |
| `PLAYWRIGHT_BASE_URL`                 | No       | Deployment to test (default `http://localhost:3000`).                                                                                                                                        |

**Specs using Bread Wallet are skipped, not failed, when Bread Wallet isn't installed.** A run that reports `skipped` didn't test anything. These specs are tutorials 3, 4, 5, 8, 9 and 11, and the Miden Bank example.

Para test accounts only exist in Para's BETA environment (local dev), so tutorial 4 is also skipped against production.

## Running

```sh
pnpm bread-wallet                              # from the repo root
cd apps/web
pnpm test:e2e                                  # all specs
pnpm test:e2e e2e/example-miden-bank.spec.ts   # one spec
```

## Mainnet

`mainnet-network-counter.spec.ts` runs on Miden Partner Mainnet with real funds. It's skipped unless `MAINNET_E2E=1` is set with an in-place Bread profile, so `pnpm test:e2e` never runs it. It creates a Mainnet sandbox and connects Bread. Then it deploys a network counter (the sandbox's built-in "Counter Account" component, with `increment-note` allowed), funded with 0.001 USDCX from Bread, and increments it with a network note sent from Bread. It checks that the counter's balance didn't drop, which shows the note's fee sponsorship paid for the network transaction. Each run costs the wallet about 0.0015 USDCX.

```sh
MAINNET_E2E=1 BREAD_PROFILE_IN_PLACE=1 \
BREAD_PROFILE_DIR="$PWD/../../.bread-wallet/profiles/mainnet" \
BREAD_PASSWORD="$(cat ../../.bread-wallet/profiles/mainnet.password)" \
pnpm test:e2e e2e/mainnet-network-counter.spec.ts
```

The profile is a Bread wallet onboarded on Mainnet with an invite code, from Playwright's Chromium (gitignored, like the rest of `.bread-wallet/`). The spec stops before spending anything when the wallet has less than 0.002 USDCX. To top it up, run `BREAD_INVITE_CODE=<code> pnpm qa-wallet fund`. It onboards a throwaway Bread wallet with the invite code, waits for its 0.01 USDCX funding, sends it all to the QA wallet (about 0.0096 arrives), then deletes the throwaway profile. If it fails midway, the profile is kept in `.bread-wallet/profiles/burner-*`: resume with `pnpm qa-wallet fund --burner <dir>`. `pnpm qa-wallet balance` prints the QA wallet's balance.

On failure, screenshots, a video and a trace are saved in `test-results/`. Open the trace with `pnpm exec playwright show-trace test-results/<test>/trace.zip`.
