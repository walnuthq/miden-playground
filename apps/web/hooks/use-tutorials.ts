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

const useTutorials = () => {
  const router = useRouter();
  const { tutorialId, tutorialStep, dispatch } = useGlobalContext();
  const { newMintTransactionRequest, submitTransaction } = useTransactions();
  const startTutorial = async (tutorialId: string) => {
    const { initialRoute, storeDump, state } = tutorials.find(
      ({ id }) => id === tutorialId
    )!;
    router.push(initialRoute);
    await deleteStore();
    /* console.log("clear");
    await clearStore();
    console.log("clear done"); */
    const client = await mockWebClient();
    await client.forceImportStore(storeDump);
    /* console.log(
      "notes1.length",
      (await client.getInputNotes(new NoteFilter(NoteFilterTypes.All))).length
    ); */
    dispatch({
      type: "LOAD_PROJECT",
      payload: { state: stateDeserializer(state) },
    });
    if (tutorialId === "transfer-assets-between-wallets") {
      /* const { accounts } = JSON.parse(state) as State;
      const wallet = accounts.find(({ name }) => name === "Wallet A")!;
      const faucet = accounts.find(({ name }) => name === "MID Faucet")!;
      const transactionResult = await newMintTransactionRequest({
        targetAccountId: wallet.id,
        faucetId: faucet.id,
        noteType: NoteType.Public,
        amount: 1000n,
      });
      console.log(
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
        name: "MID Faucet",
        storageMode: AccountStorageMode.public(),
        tokenSymbol: "MID",
        decimals: 8,
        maxSupply: 1_000_000n,
      });
    }
    if (tutorialId === "transfer-assets-between-wallets") {
      router.push("/accounts");
      const [faucet, walletA, walletB] = await Promise.all([
        newFaucet({
          name: "MID Faucet",
          storageMode: AccountStorageMode.public(),
          tokenSymbol: "MID",
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
  const nextTutorialStep = () => dispatch({ type: "NEXT_TUTORIAL_STEP" });
  return {
    tutorialId,
    tutorialStep,
    tutorial: tutorials.find(({ id }) => id === tutorialId),
    startTutorial,
    nextTutorialStep,
  };
};

export default useTutorials;
