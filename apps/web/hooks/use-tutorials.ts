import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials";
import { defaultStore } from "@/lib/types/store";
import { defaultState } from "@/lib/types/state";
import { createClient } from "@/components/web-client-context";
import useWebClient from "@/hooks/use-web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";

const useTutorials = () => {
  const router = useRouter();
  const { midenSdk } = useMidenSdk();
  const {
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const { resetState } = useWebClient();
  const startTutorial = async (tutorialId: string) => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    await resetState(tutorial.state.networkId);
    const newClient = await createClient({
      networkId: tutorial.state.networkId,
      serializedMockChain: tutorial.state.serializedMockChain,
      midenSdk,
    });
    await newClient.forceImportStore(JSON.stringify(tutorial.store));
    const syncSummary = await newClient.syncState();
    dispatch({
      type: "LOAD_STATE",
      payload: {
        state: {
          ...tutorial.state,
          blockNum: syncSummary.blockNum(),
          completedTutorials,
        },
      },
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
    await resetState(nextTutorial.state.networkId);
    const newClient = await createClient({
      networkId: nextTutorial.state.networkId,
      serializedMockChain: nextTutorial.state.serializedMockChain,
      midenSdk,
    });
    await newClient.forceImportStore(JSON.stringify(nextTutorial.store));
    const syncSummary = await newClient.syncState();
    const newCompletedTutorials = new Set([...completedTutorials]);
    newCompletedTutorials.add(tutorial.number);
    dispatch({
      type: "LOAD_STATE",
      payload: {
        state: {
          ...nextTutorial.state,
          blockNum: syncSummary.blockNum(),
          completedTutorials: newCompletedTutorials,
        },
      },
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
