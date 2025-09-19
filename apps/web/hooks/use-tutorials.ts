import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials/tutorials";
import { webClient } from "@/lib/web-client";
import useAccounts from "@/hooks/use-accounts";
// import useTransactions from "@/hooks/use-transactions";
// import { deleteStore } from "@/lib/utils";
// import defaultScripts from "@/components/global-context/default-scripts";
// import defaultComponents from "@/components/global-context/default-components";
import { MIDEN_FAUCET_ADDRESS } from "@/lib/constants";

const useTutorials = () => {
  const router = useRouter();
  const {
    tutorialId,
    tutorialLoaded,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    dispatch,
  } = useGlobalContext();
  const { importAccountByAddress } = useAccounts();
  // const {
  //   newMintTransactionRequest,
  //   newConsumeTransactionRequest,
  //   submitTransaction,
  // } = useTransactions();
  const startTutorial = async (tutorialId: string) => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    // dispatch({ type: "RESET_STATE" });
    router.push(tutorial.initialRoute);
    // await deleteStore();
    const client = await webClient(
      tutorial.state.networkId,
      tutorial.state.serializedMockChain
    );
    await client.forceImportStore(JSON.stringify(tutorial.store));
    const syncSummary = await client.syncState();
    dispatch({
      type: "LOAD_PROJECT",
      payload: {
        state: {
          ...tutorial.state,
          // scripts: [...tutorial.state.scripts, ...defaultScripts],
          // components: [...tutorial.state.components, ...defaultComponents],
          blockNum: syncSummary.blockNum(),
        },
      },
    });
    if (tutorialId === "transfer-assets-between-wallets") {
      //
    }
    if (tutorialId === "connect-wallet-and-sign-transactions") {
      // await importAccountByAddress({
      //   name: "Miden Faucet",
      //   address: MIDEN_FAUCET_ADDRESS,
      // });
    }
  };
  const loadTutorial = async (tutorialId: string) => {
    if (tutorialId === "transfer-assets-between-wallets") {
      //
    } else if (tutorialId === "connect-wallet-and-sign-transactions") {
      await importAccountByAddress({
        name: "Miden Faucet",
        address: MIDEN_FAUCET_ADDRESS,
      });
    }
    dispatch({ type: "LOAD_TUTORIAL" });
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
    tutorialLoaded,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    tutorial: tutorials.find(({ id }) => id === tutorialId),
    startTutorial,
    loadTutorial,
    previousTutorialStep,
    setTutorialStep,
    nextTutorialStep,
    openTutorial,
    closeTutorial,
    setNextTutorialStepDisabled,
  };
};

export default useTutorials;
