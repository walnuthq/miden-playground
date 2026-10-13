# Tutorials QA — 2026-10-13

End-to-end QA of every Playground tutorial, run headless with agent-browser on local dev (`localhost:3000` + local API on `:3001`), Bread Wallet extension 1.17.3 (fresh testnet wallet from tutorial 3 on), Para logged in by email OTP, testnet SDK 0.17.3.

## Results

| # | Tutorial | Result |
|---|---|---|
| 1 | Create and fund a wallet | ✅ Pass |
| 2 | Transfer assets between wallets | ✅ Pass |
| 3 | Connect a wallet and sign transactions | ✅ Pass (fresh Bread wallet) |
| 4 | Private transfers | ✅ Pass on the 2nd attempt (see #1, now fixed) |
| 5 | Wallet backup using Miden Guardian | ✅ Pass |
| 6 | Interact with the counter contract | ✅ Pass |
| 7 | Deploy a counter contract | ✅ Pass |
| 8 | Timelock P2ID note | ✅ Pass (validated in an earlier session with Bread re-enabled) |
| 9 | Network transactions | ✅ Pass (validated in an earlier session with Bread re-enabled) |
| 10 | Foreign procedure invocation | ✅ Pass |
| 11 | Your first smart contract and custom note | ✅ Pass (validated in an earlier session with Bread re-enabled) |
| 12 | Contract verification | ✅ Pass (optional "import into a new sandbox" check not run) |

## Issues

| # | Priority | Status | Area | Issue |
|---|---|---|---|---|
| 1 | High | Fixed | Tutorial 4, step 5 | Para consume of the private note fails when the Para "Do you want to sign this transaction?" dialog is approved ~1 min after it appears: `transaction expired at block height 196498 but the block height limit was 196505`. The only feedback was a "Transaction failed." toast with the raw gRPC error that auto-dismissed after ~4s, so the note stayed in "Consumable Notes" and "Next step" stayed disabled with nothing on screen to explain why. The 20-block (~1 min) cap comes from the USDCx Faucet transfer policy (`miden-standards` 0.17 `expiration::apply_default`, `DEFAULT_EXPIRATION_BLOCK_DELTA = 20`) and can only be lowered, not raised. Fix: a persistent "Transaction expired." toast with retry guidance (Para failures no longer auto-dismiss and are cleared on retry), plus a "approve it right away" warning in the tutorial copy. |
| 2 | Medium | Open | Tutorials 1, 2, 5 | Right after a consume, the account page still lists the consumed note under "Consumable Notes" ("Consume all notes" available) until the next sync (~20s), while the vault already holds the assets. In tutorial 5 the note disappears when the proposal is created, then reappears right after the proposal executes. |
| 3 | Medium | Open | Tutorial 3, step 1 | With Bread installed but not onboarded, "Select Wallet" only opens Bread's welcome tab. The Playground shows no message, and after onboarding the user has to click "Select Wallet" again. |
| 4 | Medium | Open | Tutorials 3–5 | The connected Bread (private) account shows Nonce 0 on the accounts list and details page after several transactions. The vault is up to date. |
| 5 | Low | Fixed | Tutorial 5, step 1 | Copy said to click the account dropdown, "Add account" and "Off-chain Account (Private)", which doesn't exist in Bread 1.17.3 (the account sheet only has Card Color and Settings). Bread accounts are private by default. |
| 6 | Low | Open | Tutorial 1, step 3 | The mint success toast lists the tx-fee output note as `0x9c674be4…38067e94`, but the committed transaction page lists `0x78676262…e456f1fb`. |
| 7 | Low | Open | Tutorial 1, step 5 | "Raw Note Storage" of the P2ID note shows 4 items (indexes 2–3 are `0`) while the copy says the Account ID is split into two Felts. |
| 8 | Low | Open | Tutorial 2, step 2 | The send dialog's target account list includes the sending wallet itself and both faucets. |
| 9 | Low | Fixed | All tutorials | Success toasts render at the bottom right, over the tutorial panel's "Next step" button, while they're visible (~4s). |
| 10 | Low | Open | Infra | The remote prover intermittently fails with `connection error: i/o timeout` (tutorial 1 wallet creation, tutorial 9 network counter deployment); retrying works. |
| 11 | Low | Upstream (Bread) | Tutorials 4–5 | On reconnect, Bread's connect popup leaves "I understand the risk" unchecked (it's pre-checked on first connect) but keeps "Connect" enabled; clicking it shows "Error: Unable to continue without confirming" with "Retry". The Playground gives no feedback and stays on "Select Wallet". |
| 12 | Low | Upstream (Para) | Tutorial 4 | Para's signing dialog shows raw values (`Assets: 2000000 of 0x4cbdcaffe75f0a317482224dae6436`) instead of formatted amounts and symbols. Its Profile view logs a React hydration error (`<button>` inside `<button>`) from Para's own markup. |

## QA setup notes

- Bread Wallet extension: unpacked from the `MidenWallet.<version>.Testnet.zip` asset of the [0xMiden/wallet releases](https://github.com/0xMiden/wallet/releases), loaded with `agent-browser --extension <dir> --profile <dir>`.
- Bread's `confirm.html` approval popups aren't listed by agent-browser: drive them over raw CDP (`/json/list`, then `Runtime.evaluate`).
- Tutorials 10–12 need the local API (`apps/api`, `pnpm dev` on port 3001) with its Docker services running.
- Headless Chrome reports `document.visibilityState === "hidden"`, so Sonner toasts never auto-dismiss there. That's a headless artifact, not an app bug.
