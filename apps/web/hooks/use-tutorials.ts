import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useGlobalContext from "@/components/global-context/hook";
import { loadTutorial } from "@/components/tutorials/loaders";
import { tutorialMeta, tutorialMetas } from "@/components/tutorials/meta";
import useAppState from "@/hooks/use-app-state";
import useNetwork from "@/hooks/use-network";
import useProjects from "@/hooks/use-projects";
import { trackEvent } from "@/lib/analytics";
import type { NetworkId } from "@/lib/types/network";
import type { WorkspaceStarter } from "@/lib/types/state";
import type { Tutorial, TutorialId } from "@/lib/types/tutorial";
import { randomLowercaseId, sleep } from "@/lib/utils";
import { defaultTutorial, isTutorial } from "@/lib/utils/tutorial";
import { tutorialStatus as getTutorialStatus } from "@/lib/utils/tutorial-status";
import { confirmWorkspaceSwitch } from "@/lib/utils/workspace-guard";
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

// A tutorial's starter scripts (`Tutorial.starter`), none for most. When the
// API can't be reached, the tutorial still opens, with a warning.
const tutorialStarter = async (
  tutorial: Tutorial,
): Promise<WorkspaceStarter> => {
  if (!tutorial.starter) {
    return { scripts: [], components: [] };
  }
  try {
    return await tutorial.starter();
  } catch (error) {
    console.error("ERROR: tutorial.starter", error);
    toast.warning("The tutorial's scripts couldn't be added.", {
      description: error instanceof Error ? error.message : String(error),
    });
    return { scripts: [], components: [] };
  }
};

const toastLoadError = (error: unknown) => {
  console.error("ERROR: loadTutorial", error);
  toast.error("The tutorial couldn't be loaded.", {
    description: error instanceof Error ? error.message : String(error),
  });
};

// Loads a tutorial's steps (components/tutorials/loaders.ts), with a toast
// when the chunk can't be fetched. Undefined then.
const loadTutorialOrToast = async (id: TutorialId) => {
  try {
    return await loadTutorial(id);
  } catch (error) {
    toastLoadError(error);
    return undefined;
  }
};

// The active tutorial with its steps, once loaded: undefined until then, and
// when there is none. Only the tutorial panel and the buttons in it need it,
// the rest read `tutorialMeta` from `useTutorials`.
export const useLoadedTutorial = () => {
  const { tutorialId } = useGlobalContext();
  const [loadedTutorial, setLoadedTutorial] = useState<Tutorial>();
  useEffect(() => {
    if (!tutorialId) {
      return;
    }
    let current = true;
    loadTutorial(tutorialId).then((tutorial) => {
      if (current) {
        setLoadedTutorial(tutorial);
      }
    }, toastLoadError);
    return () => {
      current = false;
    };
  }, [tutorialId]);
  return tutorialId && loadedTutorial?.id === tutorialId
    ? loadedTutorial
    : undefined;
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
    // Fetched for the fresh state even when resuming: it's the fallback when
    // the saved store can't be imported.
    const starter = await tutorialStarter(tutorial);
    navigate(tutorial.initialRoute);
    await sleep(400);
    switchNetwork(tutorial.networkId);
    const freshState = {
      ...tutorial.state,
      scripts: [...tutorial.state.scripts, ...starter.scripts],
      components: [...tutorial.state.components, ...starter.components],
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
    const meta = tutorialMetas.find((meta) => meta.id === id);
    if (!meta) {
      return;
    }
    // Already active: carry on where it is.
    if (meta.id === tutorialId) {
      navigate(meta.initialRoute);
      openTutorial();
      return;
    }
    if (!(await confirmWorkspaceSwitch())) {
      return;
    }
    const tutorial = await loadTutorialOrToast(meta.id);
    if (!tutorial) {
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
    const meta = tutorialMetas.find((meta) => meta.id === id);
    if (!meta) {
      return;
    }
    if (!(await confirmWorkspaceSwitch())) {
      return;
    }
    const tutorial = await loadTutorialOrToast(meta.id);
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
    if (!tutorialId) {
      return;
    }
    const tutorial = await loadTutorialOrToast(tutorialId);
    if (!tutorial) {
      return;
    }
    const nextMeta = tutorialMetas[tutorial.number];
    const nextTutorial = nextMeta
      ? await loadTutorialOrToast(nextMeta.id)
      : defaultTutorial();
    if (!nextTutorial) {
      return;
    }
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
  const tutorialStatus = (id: TutorialId) =>
    getTutorialStatus(
      { tutorialId, tutorialStep, tutorialMaxStep, tutorialProgress },
      id,
    );
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
    tutorialMeta: tutorialId ? tutorialMeta(tutorialId) : undefined,
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
