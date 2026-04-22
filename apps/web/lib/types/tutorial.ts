import type { FunctionComponent } from "react";
import type { State } from "@/lib/types/state";
import type { Store } from "@/lib/types/store";
import type { NetworkId } from "@/lib/types/network";

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

export type TutorialStep = {
  title: string;
  Content: FunctionComponent;
  NextStepButton?: FunctionComponent;
};

export type Tutorial = {
  id: TutorialId;
  number: number;
  title: string;
  tagline: string;
  description: string;
  category: "beginner" | "advanced";
  initialRoute: string;
  networkId: NetworkId;
  state: State;
  store: Store | null;
  steps: TutorialStep[];
};
