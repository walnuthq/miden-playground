import { type FunctionComponent } from "react";
import { type State } from "@/lib/types/state";
import { type Store } from "@/lib/types/store";

export type TutorialStep = {
  title: string;
  Content: FunctionComponent;
  NextStepButton?: FunctionComponent;
};

export const defaultTutorialStep = (): TutorialStep => ({
  title: "",
  Content: () => null,
  NextStepButton: undefined,
});

export type Tutorial = {
  id: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  initialRoute: string;
  store: Store;
  state: State;
  steps: TutorialStep[];
};
