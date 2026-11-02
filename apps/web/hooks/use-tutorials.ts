import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { useNavigate } from "react-router";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials";
import useAppState from "@/hooks/use-app-state";
import useNetwork from "@/hooks/use-network";
import useProjects from "@/hooks/use-projects";
import { trackEvent } from "@/lib/analytics";
import type { NetworkId } from "@/lib/types/network";
import type { Tutorial, TutorialId } from "@/lib/types/tutorial";
import { randomLowercaseId, sleep } from "@/lib/utils";
import { defaultTutorial, isTutorial } from "@/lib/utils/tutorial";
import { clientGetLatestBlockNum } from "@/lib/web-client";

// The chain tip a tutorial starts at (see State.tutorialStartBlockNum), 0 on the
// mock chain or when the node can't be reached, which disables the check.
const startBlockNum = async (networkId: NetworkId) => {
  if (networkId === "mmck") {
    return 0;
  }
  try {
    return await clientGetLatestBlockNum(networkId);
  } catch (error) {
    console.error("ERROR: clientGetLatestBlockNum", error);
    return 0;
  }
};

const useTutorials = () => {
  const navigate = useNavigate();
  const { connected: walletConnected } = useWallet();
  const { switchNetwork } = useNetwork();
  const {
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials,
    tutorialProgress,
    dispatch,
  } = useGlobalContext();
  const { leaveTutorial, pushState } = useAppState();
  const { loadProject, deleteProject } = useProjects();
  // Switches to a tutorial: resumes it when it has saved progress (unless
  // `restart`), starts it over otherwise. The active tutorial is saved first,
  // unless it was just completed or is the one restarted.
  const enterTutorial = async (
    tutorial: Tutorial,
    {
      restart = false,
      completedTutorial,
    }: { restart?: boolean; completedTutorial?: Tutorial } = {},
  ) => {
    const nextTutorialProgress =
      completedTutorial || tutorial.id === tutorialId
        ? tutorialProgress
        : await leaveTutorial();
    const newCompletedTutorials = new Set([...completedTutorials]);
    if (completedTutorial) {
      newCompletedTutorials.add(completedTutorial.id);
      await deleteProject("tutorial", completedTutorial.id).catch((error) =>
        console.error("ERROR: deleteProject", error),
      );
    }
    const savedProject =
      tutorial.id && !restart && nextTutorialProgress[tutorial.id]
        ? await loadProject("tutorial", tutorial.id, tutorial.networkId).catch(
            (error) => {
              console.error("ERROR: loadProject", error);
              return null;
            },
          )
        : null;
    if (restart && tutorial.id) {
      await deleteProject("tutorial", tutorial.id).catch((error) =>
        console.error("ERROR: deleteProject", error),
      );
    }
    navigate(tutorial.initialRoute);
    await sleep(400);
    switchNetwork(tutorial.networkId);
    const freshState = {
      ...tutorial.state,
      nextStore: tutorial.store,
      tutorialStartBlockNum: await startBlockNum(tutorial.networkId),
      tutorialRunId: randomLowercaseId(),
      completedTutorials: newCompletedTutorials,
      tutorialProgress: nextTutorialProgress,
    };
    pushState(
      savedProject
        ? {
            ...savedProject.state,
            nextStore: savedProject.store,
            fallbackState: freshState,
            completedTutorials: newCompletedTutorials,
            tutorialProgress: nextTutorialProgress,
          }
        : freshState,
    );
    return { resumed: savedProject !== null };
  };
  const startTutorial = async (id: string) => {
    const tutorial = tutorials.find((tutorial) => tutorial.id === id);
    if (!tutorial) {
      return;
    }
    // Already active: carry on where it is.
    if (tutorial.id === tutorialId) {
      navigate(tutorial.initialRoute);
      openTutorial();
      return;
    }
    const { resumed } = await enterTutorial(tutorial);
    trackEvent(resumed ? "resume_tutorial" : "start_tutorial", {
      tutorial_id: tutorial.id,
      wallet_connected: walletConnected,
    });
  };
  // Drops a tutorial's saved progress and starts it over.
  const restartTutorial = async (id: string) => {
    const tutorial = tutorials.find((tutorial) => tutorial.id === id);
    if (!tutorial) {
      return;
    }
    await enterTutorial(tutorial, { restart: true });
    trackEvent("start_tutorial", {
      tutorial_id: tutorial.id,
      wallet_connected: walletConnected,
    });
  };
  const nextTutorial = async () => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    const nextTutorial = tutorials[tutorial.number] ?? defaultTutorial();
    const { resumed } = await enterTutorial(nextTutorial, {
      completedTutorial: tutorial,
    });
    trackEvent("complete_tutorial", {
      tutorial_id: tutorialId,
      wallet_connected: walletConnected,
    });
    if (nextTutorial.id) {
      trackEvent(resumed ? "resume_tutorial" : "start_tutorial", {
        tutorial_id: nextTutorial.id,
        wallet_connected: walletConnected,
      });
    }
  };
  // A tutorial's progress: the live state for the active tutorial, its saved
  // progress for one left unfinished, null otherwise.
  const tutorialStatus = (id: TutorialId) =>
    id !== "" && id === tutorialId
      ? { step: tutorialStep, maxStep: tutorialMaxStep, active: true }
      : tutorialProgress[id]
        ? { ...tutorialProgress[id], active: false }
        : null;
  const previousTutorialStep = () =>
    dispatch({ type: "PREVIOUS_TUTORIAL_STEP" });
  const nextTutorialStep = () => {
    dispatch({ type: "NEXT_TUTORIAL_STEP" });
    const nextTutorialStep = tutorialStep + 1;
    if (nextTutorialStep > tutorialMaxStep) {
      trackEvent("complete_tutorial_step", {
        tutorial_id: tutorialId,
        tutorial_step: tutorialStep,
        wallet_connected: walletConnected,
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
    isTutorial: isTutorial(tutorialId),
    // tutorialId === "create-and-fund-wallet" ||
    // tutorialId === "transfer-assets-between-wallets",
    tutorialProgress,
    tutorialStatus,
    startTutorial,
    restartTutorial,
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
