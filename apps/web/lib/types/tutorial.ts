import { type FunctionComponent } from "react";
import { type State, defaultState } from "@/lib/types/state";
import { type Store } from "@/lib/types/store";

export type TutorialStep = {
  title: string;
  Content: FunctionComponent;
  NextStepButton?: FunctionComponent;
};

export const defaultTutorialStep = (): TutorialStep => ({
  title: "",
  Content: () => null,
});

export type Tutorial = {
  id: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  category: "beginner" | "advanced";
  initialRoute: string;
  state: State;
  store: Store | null;
  steps: TutorialStep[];
};

export const defaultTutorial = (): Tutorial => ({
  id: "",
  number: 0,
  title: "",
  tagline: "",
  description: "",
  category: "beginner",
  initialRoute: "/",
  state: defaultState(),
  store: null,
  steps: [],
});
