import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useNotes from "@/hooks/use-notes";
import { P2ID_NOTE_CODE } from "@/lib/constants";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";

// The private P2ID note sent by the Bread Wallet to the Para Wallet during this
// tutorial. Starting the tutorial resets the client store, which then fetches
// the Para Wallet's private notes again from the note transport layer, so notes
// from a previous run are told apart by their inclusion block.
const useTransferNote = () => {
  const { tutorialStartBlockNum } = useGlobalContext();
  const { wallets } = useAccounts();
  const { inputNotes } = useNotes();
  const breadWallet = wallets.find(({ name }) => name === "Bread Wallet");
  const paraWallet = wallets.find(({ name }) => name === "Para Wallet");
  return inputNotes.find(
    ({ senderId, scriptRoot, storage, type, blockNum }) =>
      !!breadWallet &&
      !!paraWallet &&
      senderId === breadWallet.id &&
      scriptRoot === P2ID_NOTE_CODE &&
      accountIdFromPrefixSuffix(storage[1] ?? "", storage[0] ?? "") ===
        paraWallet.id &&
      type === "private" &&
      blockNum > tutorialStartBlockNum,
  );
};

export default useTransferNote;
