import type { FunctionComponent } from "react";
import type { NetworkId } from "@/lib/types/network";
import type { State } from "@/lib/types/state";
import type { Store } from "@/lib/types/store";
import type { TutorialId } from "@/lib/types/tutorial-id";

export type { TutorialId };

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
