import type { FunctionComponent } from "react";
import type { NetworkId } from "@/lib/types/network";
import type { State, WorkspaceStarter } from "@/lib/types/state";
import type { Store } from "@/lib/types/store";
import type { TutorialId } from "@/lib/types/tutorial-id";

export type { TutorialId };

export type TutorialStep = {
  title: string;
  Content: FunctionComponent;
  NextStepButton?: FunctionComponent;
};

// What the home page and the project switcher show of a tutorial
// (components/tutorials/meta.ts): the app shell renders them before the SDK
// loads, which the step components import.
export type TutorialMeta = {
  id: TutorialId;
  number: number;
  title: string;
  tagline: string;
  description: string;
  category: "beginner" | "advanced";
  initialRoute: string;
  // `steps.length`, for the cards before the steps load; checked against the
  // steps in components/tutorials/loaders.ts (dev only).
  stepCount: number;
  // Whether a step has the user connect Bread Wallet and sign with it: the
  // first step then asks to install the extension when it's missing.
  requiresWallet: boolean;
  // Set while the tutorial can't be completed: the reason, shown on its card
  // and its menu item, which are disabled. It can't be started or restarted,
  // and "Next tutorial" skips it. Saved progress is kept.
  unavailable?: string;
};

export type TutorialStarter = WorkspaceStarter &
  Partial<Pick<State, "accounts">>;

export type Tutorial = TutorialMeta & {
  networkId: NetworkId;
  state: State;
  store: Store | null;
  // Scripts and components fetched from the API when the tutorial starts
  // fresh (a precompiled example's packages, too big to embed), appended to
  // `state`'s, with the accounts whose components are among them (a
  // component is a script id, the API's UUID here). When the API is down, the
  // tutorial opens without them, with a warning. Most tutorials embed their
  // scripts in `state` instead.
  starter?: () => Promise<TutorialStarter>;
  steps: TutorialStep[];
};
