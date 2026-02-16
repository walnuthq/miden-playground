import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials";
import { defaultTutorial } from "@/lib/types/tutorial";
import useAppState from "@/hooks/use-app-state";
import { saEvent } from "@/lib/simple-analytics";
import { sleep } from "@/lib/utils";

const useTutorials = () => {
  const router = useRouter();
  const {
    blockNum,
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const { pushState } = useAppState();
  const startTutorial = async (tutorialId: string) => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    router.push(tutorial.initialRoute);
    await sleep(400);
    pushState({
      ...tutorial.state,
      blockNum:
        tutorial.state.networkId === "mmck"
          ? tutorial.state.blockNum
          : blockNum,
      nextStore: tutorial.store,
      completedTutorials,
    });
    saEvent("start_tutorial", { tutorial_id: tutorialId });
  };
  const nextTutorial = async () => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    const nextTutorial = tutorials[tutorial.number] ?? defaultTutorial();
    router.push(nextTutorial.initialRoute);
    await sleep(400);
    const newCompletedTutorials = new Set([...completedTutorials]);
    newCompletedTutorials.add(tutorial.id);
    pushState({
      ...nextTutorial.state,
      blockNum:
        nextTutorial.state.networkId === "mmck"
          ? nextTutorial.state.blockNum
          : blockNum,
      nextStore: nextTutorial.store,
      completedTutorials: newCompletedTutorials,
    });
    saEvent("complete_tutorial", { tutorial_id: tutorialId });
    if (nextTutorial.id) {
      saEvent("start_tutorial", { tutorial_id: nextTutorial.id });
    }
  };
  const previousTutorialStep = () =>
    dispatch({ type: "PREVIOUS_TUTORIAL_STEP" });
  const nextTutorialStep = () => {
    dispatch({ type: "NEXT_TUTORIAL_STEP" });
    const nextTutorialStep = tutorialStep + 1;
    if (nextTutorialStep > tutorialMaxStep) {
      saEvent("complete_tutorial_step", {
        tutorial_id: tutorialId,
        tutorial_step: tutorialStep,
      });
    }
  };
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
