import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials";
import { defaultStore } from "@/lib/types/store";
import { defaultState } from "@/lib/types/state";
import useWebClient from "@/hooks/use-web-client";

const useTutorials = () => {
  const router = useRouter();
  const {
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const { pushState } = useWebClient();
  const startTutorial = async (tutorialId: string) => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    pushState({
      pushedState: { ...tutorial.state, completedTutorials },
      pushedStore: tutorial.store,
    });
    router.push(tutorial.initialRoute);
  };
  const nextTutorial = async () => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    const nextTutorial = tutorials[tutorial.number] ?? {
      initialRoute: "/",
      state: defaultState(),
      store: defaultStore(),
    };
    const newCompletedTutorials = new Set([...completedTutorials]);
    newCompletedTutorials.add(tutorial.number);
    pushState({
      pushedState: {
        ...nextTutorial.state,
        completedTutorials: newCompletedTutorials,
      },
      pushedStore: nextTutorial.store,
    });
    router.push(nextTutorial.initialRoute);
  };
  const previousTutorialStep = () =>
    dispatch({ type: "PREVIOUS_TUTORIAL_STEP" });
  const nextTutorialStep = () => dispatch({ type: "NEXT_TUTORIAL_STEP" });
  const setTutorialStep = (tutorialStep: number) =>
    dispatch({ type: "SET_TUTORIAL_STEP", payload: { tutorialStep } });
  const openTutorial = () => dispatch({ type: "OPEN_TUTORIAL" });
  const closeTutorial = () => dispatch({ type: "CLOSE_TUTORIAL" });
  const setNextTutorialStepDisabled = (disabled: boolean) =>
    dispatch({
      type: "SET_NEXT_TUTORIAL_STEP_DISABLED",
      payload: { disabled },
    });
  return {
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials,
    tutorial: tutorials.find(({ id }) => id === tutorialId),
    startTutorial,
    nextTutorial,
    previousTutorialStep,
    setTutorialStep,
    nextTutorialStep,
    openTutorial,
    closeTutorial,
    setNextTutorialStepDisabled,
  };
};

export default useTutorials;
