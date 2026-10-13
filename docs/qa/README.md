# Tutorials QA playbook

How to QA the Playground tutorials end to end with a headless browser, Bread Wallet and Para, written for agents and humans picking this up cold. Past reports live next to this file (`YYYY-MM-DD-tutorials.md`): read the latest one first to know the known issues.

## 1. Setup

### Browser and helpers
- Use [agent-browser](https://github.com/vercel-labs/agent-browser), **headless**. `source docs/qa/scripts/qa.sh` gives the helpers used below (`clk`, `jsclick`, `step`, `waitnext`, `popup*`, `approveloop`, `invoke`, …), and `docs/qa/scripts/cdp.mjs` drives the Bread popups.
- zsh doesn't word-split variables: don't build commands as `$AB open …`. Use the `ab` function from `qa.sh`.

### Bread Wallet extension
- Get it from the `MidenWallet.<version>.Testnet.zip` asset of the [0xMiden/wallet releases](https://github.com/0xMiden/wallet/releases) and unzip it to a stable folder, e.g. `~/miden/extensions/bread-wallet`. Copying it out of Chrome's profile fails on macOS ("Operation not permitted", TCC).
- Launch with a persistent profile so the wallet survives between sessions:
  `agent-browser --session qa --extension ~/miden/extensions/bread-wallet --profile ~/miden/extensions/<profile> open <url>`
- The manifest has no `key`, so the extension ID is derived from the folder path and changes if the folder moves. Wallet UI: `chrome-extension://<id>/fullpage.html`. Activity is behind the bell icon (labelled "Unread").
- To upgrade, unzip the new release over the same folder.
- First-time onboarding: Get started → password → Guardian (take the suggested "Continue with …" provider: offline providers can't be picked) → "Not now" for telemetry. New accounts are **private** and Guardian-backed. Fund through the tutorials' Mint button (tutorial 3) or the wallet's "Fund your wallet".
- Keep the wallet password in a file outside the repo (mode 0600). Testnet only, never a real seed.

### Para
- Log in with an email address you can read programmatically (e.g. the Gmail connector): the code is in the subject line.
- Local dev uses Para's **beta** environment (codes from `no-reply@beta.getpara.com`). Production `playground.miden.xyz` uses Para **production** (`no-reply@getpara.com`), which is a different Para wallet for the same email.

### Local dev
- `apps/web`: `pnpm dev` (port 3000). `apps/api`: `pnpm dev` (port 3001) with its Docker services (postgres, compile) running. Tutorials 10–12 (and any script created through the API) hang on "Creating…" with "Failed to fetch" if the API is down.
- A different origin (localhost vs production) means a fresh Playground state and a new Bread connection request.

## 2. Pitfalls (read before driving the UI)

| Pitfall | What happens | Do this |
|---|---|---|
| Bread popups are invisible to agent-browser | `confirm.html` (connect, confirm, opaque signature) never shows in `ab tab` or via `connect` | Use `haspopup` / `popuptext` / `popupclick Confirm` (raw CDP via `cdp.mjs`) |
| Bread connect checkbox | "I understand the risk" is often **unchecked**; "Connect" stays enabled and fails with "Unable to continue without confirming" | `breadconnect` ticks it first |
| Bread not onboarded | "Select Wallet" just opens Bread's welcome tab; the Playground shows nothing | Onboard in a tab (`ab tab new chrome-extension://<id>/fullpage.html`), then click "Select Wallet" again |
| Radix dropdowns/selects | `jsclick` (DOM `click()`) doesn't open them; they need pointer events | `clk 'button "…"'` then `clk 'option "…"'` / `clk 'menuitemradio "…"'` |
| Enter on Radix Select in a non-modal dialog | Headless Chrome floods keydown events and the tab freezes | Never select with Enter; click options |
| Escape in a dialog | Closes the whole dialog, not just the open listbox | Close listboxes by clicking blank dialog space (`mouseclick`), or click the next control directly |
| Combobox listbox options (account pickers) | After opening, refs can be stale or options overlap other fields | `options` prints coordinates; `mouseclick x y` |
| Refs go stale | Any snapshot of a menu/listbox re-numbers refs | Re-snapshot right before `ab click @eN` / `ab fill @eN` |
| Toasts | Headless pages can report `visibilityState: hidden`, and then Sonner toasts never auto-dismiss and can cover buttons | `jsclick 'Next step'`; `toasts` to read them |
| Para modal | Not in the accessibility tree | Screenshot, then `mouseclick` at the coordinates. Check `innerWidth`: the viewport can change size mid-session |
| Monaco editor | Typing into it is unreliable | Edit through `window.monaco.editor.getModels()[0]` with `pushEditOperations` (keeps undo and change events) |
| Folder upload (contract verification) | `webkitdirectory` input | `ab upload '#project-dir' <unzipped-dir>` works |
| Downloads | — | `ab download <menuitem-ref> <path>` |
| Slow dev compile | First navigation to a page can take seconds in dev | Wait (`ab wait`) before concluding a link is broken |
| Network notes and USDCx transactions expire | Moving USDCx triggers the USDCx Faucet transfer policy, which caps expiration at **20 blocks (~1 min)** (`miden-standards` `DEFAULT_EXPIRATION_BLOCK_DELTA`, can only be lowered). A slow Para/Bread approval fails with "transaction expired" | Approve signing prompts immediately (poll for the prompt, then click) |

## 3. Per-tutorial notes

| # | Tutorial | Wallet | Notes |
|---|---|---|---|
| 1 | Create and fund a wallet | none | Mint 100 MDN from the MDN Faucet to Wallet A, then "Consume note with Wallet A". |
| 2 | Transfer assets between wallets | none | Wallet A/B are shared, pre-funded store accounts. Send 100 MDN A→B, then "Consume all notes" on B. |
| 3 | Connect a wallet and sign transactions | Bread | The Mint button sends 10 USDCx; Bread auto-consumes it. Step 2 completes only once the note shows **consumed** (next sync). Send ≤1 USDCX privately to Test Wallet. |
| 4 | Private transfers | Bread + Para | Mint (Bread) → Para login → disconnect Para (Para button → profile icon, the 4th button → Disconnect) → reconnect Bread → private send ≥1 USDCX to Para → Para login → consume the newest note and **approve immediately**. |
| 5 | Wallet backup (Guardian) | Bread | Lots of "Opaque signature request" popups: deploy (2), consume proposal (2), sign (4), execute (2), restore (2). `approveloop` with a stop condition. Wait for the proposal **status cell** to read Ready (the tutorial copy also contains "Ready"). Step 6 deletes the guardian wallet and disconnects Bread; restore it with its address. |
| 6 | Interact with the counter contract | none | Import `counterContractAddress` (`apps/web/lib/constants.ts`). The sidebar has both an account and a component named "Counter Contract": use the step's "click its name" link. |
| 7 | Deploy a counter contract | none | Edit `felt!(1)` → `felt!(5)` at line 41, compile, check `add.5` in MASM. Component + map slot `counter_contract::counter_contract::count_map`, key 1 → 0. |
| 8 | Timelock P2ID note | Bread | Edit the P2ID script (3 storage items + block-height assert). Note storage values (suffix, prefix, height) are in the step 4 panel. Bread-signed custom note. |
| 9 | Network transactions | Bread | Network Account auth + counter-note allowlist. In Create Note, **check the "Network note" switch is on before Create** (it can come back off). Approve in Bread immediately. |
| 10 | Foreign procedure invocation | none | Deploy Count Reader, invoke `copy_count` with Counter Contract, compare with its `get_count`. |
| 11 | Your first smart contract and custom note | Bread | The script must be named exactly `counter-account`. Don't send other notes to the counter: step 7 completes once it has no consumable notes. |
| 12 | Contract verification | none | The script name has a random suffix (read it from the panel). Export → unzip (flat archive) → upload the folder → Verify. Optional: import the contract into a new sandbox and check it's verified. |

## 4. Expect flakiness (testnet)

- **Remote prover `i/o timeout`**: wallet creation or deploy fails, sometimes silently (Deploy Account just returns to its button). Retry.
- **Node submit timeout**: Bread shows "Transaction failed… request to Miden node timed out… safe to retry" in Activity while the Playground step just never completes. This is testnet load (it came and went over ~1h on 2026-10-13). Check Bread Activity → "Show full error", then retry from the Playground.
- **Stale "Consumable Notes"** right after a consume, until the next sync (~20s).

Retry at least once before reporting a failure as a Playground bug, and compare with a run on the other environment (local vs production) at the same time.

## 5. Automated tests (Playwright)

`apps/web/e2e` holds Playwright tests that replay tutorials against a live Playground on testnet (`pnpm --filter web test:e2e`, `PLAYWRIGHT_BASE_URL` to target a deployment, local dev by default). Each test runs in a fresh browser context, so it's a brand-new user. Tutorials 1–3 are covered so far.

- Helpers are in `apps/web/e2e/tutorial.ts`: `startTutorial`, `nextStep` (waits for Next step to unlock), and `tutorialPanel(page).openLink`, which waits until a step link's target is known (links built from synced state point to `.../undefined` until the next sync).
- Scope locators to the tutorial panel (`#tutorial`): success toasts repeat names like "Wallet A".
- Tutorial store accounts (e.g. Wallet A/B in tutorial 2) are shared by every Playground user: compare balances before and after instead of asserting fixed amounts.
- Dialog titles change between stages (e.g. "Configure mint transaction" → "Preview mint transaction").
- Bread tests import `test` from `apps/web/e2e/bread.ts` and need `BREAD_EXTENSION_DIR` (the unpacked extension; skipped otherwise). The fixture launches Playwright's own Chromium (`channel: "chromium"`, headless) with the extension in a persistent context, onboards a **new wallet** in a throwaway first launch (Bread never answers dapp requests from the browser session that onboarded it), then relaunches and unlocks it from `fullpage.html`, which stays open because Bread syncs and auto-consumes from its UI. `bread.connect(page)` handles the connection popup; `bread.approve(action)` confirms the `confirm.html` popup that `action` opens and returns its text.
- Profiles from agent-browser's Chrome can't be reused: Chrome 151 stores the extension's IndexedDB in a layout Playwright's Chromium ignores, so Bread starts with an empty account database ("Account not found in local storage"). `BREAD_PROFILE_DIR` + `BREAD_PASSWORD` only work with a profile onboarded in Playwright's Chromium.
- Bread popup quirks under Playwright: the connect popup's risk checkbox is a visually hidden input (click it through the DOM), and after Confirm the headless popup can stay open, blank (the fixture closes it).
- Testnet flakiness applies: keep timeouts generous (`TRANSACTION_TIMEOUT`, 3 min) and expect occasional prover/node timeouts.

## 6. Reporting

- Log findings as you go (`note "…"` appends to `$QA_LOG`) with severity (High/Medium/Low), tutorial and step, exact error text and what the user sees.
- Write the report as `docs/qa/YYYY-MM-DD-tutorials.md`: a results table per tutorial, then an issues table (#, priority, status, area, issue), as in the existing reports.
- Don't fix during a QA pass unless asked: report, then let the team prioritize.
