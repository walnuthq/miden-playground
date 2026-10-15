# End-to-end tests

Playwright tests for the tutorials and examples. They run against a live Playground on testnet, so transactions are proven and submitted for real: expect minutes per test. Tests run one at a time because they share testnet accounts.

## Prerequisites

1. Install Playwright's Chromium once: `pnpm exec playwright install chromium`.
2. Start the Playground (`pnpm dev` in `apps/web`, port 3000), unless you set `PLAYWRIGHT_BASE_URL`.
3. For the specs that compile scripts, start `apps/api` too (`pnpm dev` in `apps/api`, port 3001), with its Docker services (postgres and the compile service) up. These specs are the two examples and tutorials 11 and 12. Tutorials 7 and 8 compile through mock routes in `apps/web` and don't need it.
4. Set `BREAD_EXTENSION_DIR` (see below) for the specs that use Bread Wallet.

## Environment variables

| Variable                              | Required        | Description                                                                                                                                                                                                                                |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BREAD_EXTENSION_DIR`                 | For Bread specs | Absolute path to the unpacked Bread Wallet extension: the `MidenWallet.<version>.Testnet.zip` asset of the [wallet releases](https://github.com/0xMiden/wallet/releases), unzipped.                                                        |
| `BREAD_PROFILE_DIR`, `BREAD_PASSWORD` | No              | Run on a copy of a Chromium profile where Bread is already onboarded (e.g. a funded wallet) instead of onboarding a new wallet per test. The profile must come from Playwright's Chromium, and from the same `BREAD_EXTENSION_DIR` folder. |
| `PARA_EMAIL`                          | No              | Para test account for tutorial 4 (default `playground-e2e@test.getpara.com`).                                                                                                                                                              |
| `PLAYWRIGHT_BASE_URL`                 | No              | Deployment to test (default `http://localhost:3000`).                                                                                                                                                                                      |

**Specs using Bread Wallet are skipped, not failed, when `BREAD_EXTENSION_DIR` isn't set.** A run that reports `skipped` didn't test anything. These specs are tutorials 3, 4, 5, 8, 9 and 11, and the Miden Bank example.

Para test accounts only exist in Para's BETA environment (local dev), so tutorial 4 is also skipped against production.

## Running

```sh
cd apps/web
export BREAD_EXTENSION_DIR=/path/to/bread-wallet
pnpm test:e2e                                  # all specs
pnpm test:e2e e2e/example-miden-bank.spec.ts   # one spec
```

On failure, screenshots, a video and a trace are saved in `test-results/`. Open the trace with `pnpm exec playwright show-trace test-results/<test>/trace.zip`.
