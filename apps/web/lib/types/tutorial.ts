import { type FunctionComponent } from "react";
import { type State } from "@/components/global-context/reducer";
import { type Store } from "@/lib/types/store";

export type TutorialStep = {
  title: string;
  Content: FunctionComponent;
  NextStepButton?: FunctionComponent;
};

export type Tutorial = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  initialRoute: string;
  store: Store;
  state: State;
  steps: TutorialStep[];
};
