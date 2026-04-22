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
