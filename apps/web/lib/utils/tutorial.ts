import type { Tutorial, TutorialStep } from "@/lib/types/tutorial";
import { defaultState } from "@/lib/utils/state";

export const defaultTutorialStep = (): TutorialStep => ({
  title: "",
  Content: () => null,
});

export const defaultTutorial = (): Tutorial => ({
  id: "",
  number: 0,
  title: "",
  tagline: "",
  description: "",
  category: "beginner",
  initialRoute: "/",
  networkId: "mtst",
  state: defaultState(),
  store: null,
  steps: [],
});

export const isTutorial = (tutorialId: string) =>
  [
    "create-and-fund-wallet",
    "transfer-assets-between-wallets",
    // "private-transfers",
    // "timelock-p2id-note",
  ].includes(tutorialId);

// Tutorials whose notes Bread Guardian wallets can't create yet (0xMiden/wallet#1422).
export const isParaOnlyTutorial = (tutorialId: string) =>
  [
    "timelock-p2id-note",
    "network-transactions",
    "your-first-smart-contract-and-custom-note",
  ].includes(tutorialId);
