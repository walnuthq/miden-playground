import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials";
import { webClient } from "@/lib/web-client";
import useAccounts from "@/hooks/use-accounts";
import { defaultStore, deleteStore } from "@/lib/types/store";
import { defaultState } from "@/lib/types/state";
// import useTransactions from "@/hooks/use-transactions";
// import defaultScripts from "@/components/global-context/default-scripts";
// import defaultComponents from "@/components/global-context/default-components";
import {
  COUNTER_CONTRACT_ADDRESS,
  MIDEN_FAUCET_ADDRESS,
  TEST_WALLET_ADDRESS,
} from "@/lib/constants";

const useTutorials = () => {
  const router = useRouter();
  const {
    networkId,
    tutorialId,
    tutorialLoaded,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    completedTutorials,
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
    if (networkId !== "mlcl") {
      const previousWebClient = await webClient(networkId, null);
      await previousWebClient.syncState();
    }
    await deleteStore();
    const client = await webClient(
      tutorial.state.networkId,
      tutorial.state.serializedMockChain
    );
    router.push(tutorial.initialRoute);
    await client.forceImportStore(JSON.stringify(tutorial.store));
    const syncSummary = await client.syncState();
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
  };
  const loadTutorial = async (tutorialId: string) => {
    if (tutorialId === "connect-wallet-and-sign-transactions") {
      await importAccountByAddress({
        name: "Miden Faucet",
        address: MIDEN_FAUCET_ADDRESS,
      });
    } else if (tutorialId === "timelock-p2id-note") {
      await importAccountByAddress({
        name: "Miden Faucet",
        address: MIDEN_FAUCET_ADDRESS,
      });
      await importAccountByAddress({
        name: "Test Wallet",
        address: TEST_WALLET_ADDRESS,
      });
    } else if (tutorialId === "foreign-procedure-invocation") {
      await importAccountByAddress({
        name: "Counter Contract",
        address: COUNTER_CONTRACT_ADDRESS,
      });
    }
    dispatch({ type: "LOAD_TUTORIAL" });
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
    router.push(nextTutorial.initialRoute);
    const client = await webClient(
      nextTutorial.state.networkId,
      nextTutorial.state.serializedMockChain
    );
    await client.syncState();
    await deleteStore();
    await client.forceImportStore(JSON.stringify(nextTutorial.store));
    const syncSummary = await client.syncState();
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
    completedTutorials,
    // tutorial: tutorials.find(({ id }) => id === tutorialId),
    startTutorial,
    loadTutorial,
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
