import { type State, defaultState } from "@/lib/types/state";

export type TutorialAction =
  | {
      type: "START_TUTORIAL";
      payload: { tutorialId: string };
    }
  | {
      type: "LOAD_TUTORIAL";
    }
  | { type: "PREVIOUS_TUTORIAL_STEP" }
  | { type: "NEXT_TUTORIAL_STEP" }
  | { type: "SET_TUTORIAL_STEP"; payload: { tutorialStep: number } }
  | { type: "OPEN_TUTORIAL" }
  | { type: "CLOSE_TUTORIAL" }
  | {
      type: "SET_NEXT_TUTORIAL_STEP_DISABLED";
      payload: { disabled: boolean };
    };

const reducer = (state: State, action: TutorialAction): State => {
  switch (action.type) {
    case "START_TUTORIAL": {
      return {
        ...defaultState(),
        tutorialId: action.payload.tutorialId,
        tutorialStep: 0,
        tutorialMaxStep: 0,
      };
    }
    case "LOAD_TUTORIAL": {
      return {
        ...state,
        tutorialLoaded: true,
      };
    }
    case "PREVIOUS_TUTORIAL_STEP": {
      return {
        ...state,
        tutorialStep: state.tutorialStep - 1,
      };
    }
    case "NEXT_TUTORIAL_STEP": {
      return {
        ...state,
        tutorialStep: state.tutorialStep + 1,
        tutorialMaxStep: state.tutorialStep + 1,
      };
    }
    case "SET_TUTORIAL_STEP": {
      return {
        ...state,
        tutorialStep: action.payload.tutorialStep,
      };
    }
    case "OPEN_TUTORIAL": {
      return {
        ...state,
        tutorialOpen: true,
      };
    }
    case "CLOSE_TUTORIAL": {
      return {
        ...state,
        tutorialOpen: false,
      };
    }
    case "SET_NEXT_TUTORIAL_STEP_DISABLED": {
      return {
        ...state,
        nextTutorialStepDisabled: action.payload.disabled,
      };
    }
  }
};

export default reducer;
