import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials";
import { defaultTutorial } from "@/lib/types/tutorial";
import useWebClient from "@/hooks/use-web-client";
import useAccounts from "@/hooks/use-accounts";
import { saEvent } from "@/lib/simple-analytics";

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
  const { connectedWallet } = useAccounts();
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
    saEvent("start_tutorial", {
      wallet: connectedWallet?.address ?? "",
      tutorialId,
    });
  };
  const nextTutorial = async () => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    const nextTutorial = tutorials[tutorial.number] ?? defaultTutorial();
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
    saEvent("complete_tutorial", {
      wallet: connectedWallet?.address ?? "",
      tutorialId,
    });
    if (nextTutorial.id) {
      saEvent("start_tutorial", {
        wallet: connectedWallet?.address ?? "",
        tutorialId: nextTutorial.id,
      });
    }
  };
  const previousTutorialStep = () =>
    dispatch({ type: "PREVIOUS_TUTORIAL_STEP" });
  const nextTutorialStep = () => {
    dispatch({ type: "NEXT_TUTORIAL_STEP" });
    const nextTutorialStep = tutorialStep + 1;
    if (nextTutorialStep > tutorialMaxStep) {
      saEvent("complete_tutorial_step", {
        wallet: connectedWallet?.address ?? "",
        tutorialId,
        tutorialStep,
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
