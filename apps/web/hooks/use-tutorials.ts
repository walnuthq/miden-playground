import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials/tutorials";
import { mockWebClient } from "@/lib/mock-web-client";
import {
  stateDeserializer,
  type State,
} from "@/components/global-context/reducer";
import useTransactions from "@/hooks/use-transactions";
import {
  NoteFilter,
  NoteType,
  NoteFilterTypes,
} from "@workspace/mock-web-client";
import { deleteStore } from "@/lib/utils";
import useAccounts from "@/hooks/use-accounts";

const useTutorials = () => {
  const router = useRouter();
  const {
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialOpen,
    nextTutorialStepDisabled,
    dispatch,
  } = useGlobalContext();
  const { accounts } = useAccounts();
  const {
    newMintTransactionRequest,
    newConsumeTransactionRequest,
    submitTransaction,
  } = useTransactions();
  const startTutorial = async (tutorialId: string) => {
    const tutorial = tutorials.find(({ id }) => id === tutorialId);
    if (!tutorial) {
      return;
    }
    // dispatch({ type: "RESET_STATE" });
    router.push(tutorial.initialRoute);
    // await deleteStore();
    /* console.log("clear");
    await clearStore();
    console.log("clear done"); */
    const client = await mockWebClient();
    await client.forceImportStore(tutorial.storeDump);
    console.log(
      "notes1.length",
      (await client.getInputNotes(new NoteFilter(NoteFilterTypes.All))).length
    );
    dispatch({
      type: "LOAD_PROJECT",
      payload: { state: stateDeserializer(tutorial.state) },
    });
    if (tutorialId === "transfer-assets-between-wallets") {
      //console.log("accounts", accounts.length);
      /* const state = JSON.parse(tutorial.state) as State;
      const faucet = state.accounts.find(({ name }) => name === "MDN Faucet")!;
      const wallet = state.accounts.find(({ name }) => name === "Wallet A")!;
      const mintTransactionResult = await newMintTransactionRequest({
        targetAccountId: wallet.id,
        faucetId: faucet.id,
        noteType: NoteType.Public,
        amount: 1000n,
      });
      console.log("MINTING...");
      const transactionRecord = await submitTransaction(mintTransactionResult);
      console.log("MINT TX OK");
      const note = transactionRecord.outputNotes().getNote(0);
      const consumeTransactionResult = await newConsumeTransactionRequest({
        accountId: wallet.id,
        noteIds: [note.id().toString()],
      });
      await submitTransaction(consumeTransactionResult);
      console.log("SUBMIT TX OK"); */
      //
      /* console.log(
        "notes2.length",
        (await client.getInputNotes(new NoteFilter(NoteFilterTypes.All))).length
      );
      console.log(
        "createdNotes.numNotes",
        transactionResult.createdNotes().numNotes()
      );
      console.log("INIT ALMOST DONE");
      const transactionRecord = await submitTransaction(transactionResult);
      console.log(
        "notes3.length",
        (await client.getInputNotes(new NoteFilter(NoteFilterTypes.All))).length
      );
      const note = transactionRecord.outputNotes().notes()[0];
      if (note) {
        console.log("NOTE ID", note.id().toString());
      }
      console.log("transactionRecord.id", transactionRecord.id().toHex());
      console.log("INIT DONE"); */
    }
    // dispatch({ type: "START_TUTORIAL", payload: { tutorialId } });
    /* if (tutorialId === "create-and-fund-wallet") {
      router.push("/accounts");
      newFaucet({
        name: "MDN Faucet",
        storageMode: AccountStorageMode.public(),
        tokenSymbol: "MDN",
        decimals: 8,
        maxSupply: 1_000_000n,
      });
    }
    if (tutorialId === "transfer-assets-between-wallets") {
      router.push("/accounts");
      const [faucet, walletA, walletB] = await Promise.all([
        newFaucet({
          name: "MDN Faucet",
          storageMode: AccountStorageMode.public(),
          tokenSymbol: "MDN",
          decimals: 8,
          maxSupply: 1_000_000n,
        }),
        newWallet({
          name: "Wallet A",
          storageMode: AccountStorageMode.public(),
        }),
        newWallet({
          name: "Wallet B",
          storageMode: AccountStorageMode.public(),
        }),
      ]);
      const transactionResult = await newMintTransactionRequest({
        targetAccountId: walletA.id,
        faucetId: faucet.id,
        noteType: NoteType.Public,
        amount: 1000n,
      });
      console.log(
        "createdNotes.numNotes",
        transactionResult.createdNotes().numNotes()
      );
      console.log("INIT ALMOST DONE");
      await sleep(1000);
      const transactionRecord = await submitTransaction(transactionResult);
      console.log("transactionRecord.id", transactionRecord.id().toHex());
      console.log("INIT DONE");
    } */
  };
  const loadTutorial = async (tutorialId: string) => {
    if (tutorialId === "transfer-assets-between-wallets") {
      console.log("accounts", accounts.length);
      const faucet = accounts.find(({ name }) => name === "MDN Faucet")!;
      const wallet = accounts.find(({ name }) => name === "Wallet A")!;
      const mintTransactionResult = await newMintTransactionRequest({
        targetAccountId: wallet.id,
        faucetId: faucet.id,
        noteType: NoteType.Public,
        amount: 1000n,
      });
      console.log("MINTING...");
      const transactionRecord = await submitTransaction(mintTransactionResult);
      console.log("MINT TX OK");
      const note = transactionRecord.outputNotes().getNote(0);
      const consumeTransactionResult = await newConsumeTransactionRequest({
        accountId: wallet.id,
        noteIds: [note.id().toString()],
      });
      console.log("SUBMITTING...");
      await submitTransaction(consumeTransactionResult);
      console.log("SUBMIT TX OK");
    }
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
