// On its own, with no imports, so that modules with a `node --test`
// (tsconfig.node.json, where `@/` imports don't resolve) can import it
// relatively; `lib/types/tutorial.ts` re-exports it for the app.
export type TutorialId =
  | ""
  | "create-and-fund-wallet"
  | "transfer-assets-between-wallets"
  | "connect-wallet-and-sign-transactions"
  | "private-transfers"
  | "interact-with-the-counter-contract"
  | "deploy-a-counter-contract"
  | "timelock-p2id-note"
  | "network-transactions"
  | "foreign-procedure-invocation"
  | "your-first-smart-contract-and-custom-note"
  | "contract-verification"
  | "wallet-backup-using-miden-guardian";
