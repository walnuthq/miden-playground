import { useRouter } from "next/navigation";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials/tutorials";
import { mockWebClient } from "@/lib/mock-web-client";
import { stateDeserializer } from "@/components/global-context/reducer";

const useTutorials = () => {
  const router = useRouter();
  const { tutorialId, tutorialStep, dispatch } = useGlobalContext();
  const startTutorial = async (tutorialId: string) => {
    router.push("/accounts");
    const { storeDump, state } = tutorials.find(({ id }) => id === tutorialId)!;
    const client = await mockWebClient();
    await client.forceImportStore(storeDump);
    dispatch({
      type: "LOAD_PROJECT",
      payload: { state: stateDeserializer(state) },
    });
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
