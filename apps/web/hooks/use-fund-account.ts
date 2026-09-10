import { type Account as WasmAccount } from "@miden-sdk/miden-sdk/lazy";
import { useMiden, useTransaction } from "@miden-sdk/react/lazy";
import { clientGetBlockHeaderByNumber } from "@/lib/web-client";
import useNetwork from "@/hooks/use-network";
import { requestFundingNote, waitForFundingNote } from "@/lib/miden-faucet";

const useFundAccount = () => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { execute } = useTransaction();
  // Funds the account with the network's native fee asset so it can pay for its
  // own transactions, then returns the funded account.
  const fundAccount = async (account: WasmAccount) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const blockHeader = await clientGetBlockHeaderByNumber({ networkId });
    const { noteId, txId } = await requestFundingNote({
      networkId,
      recipient: account.id(),
      expectedFaucet: blockHeader.feeFaucetId(),
    });
    const fundingNote = await waitForFundingNote({
      client,
      networkId,
      noteId,
      txId,
    });
    const transactionRequest = await client.newConsumeTransactionRequest(
      [fundingNote.toNote()],
      account.id(),
    );
    await execute({
      accountId: account.id(),
      request: transactionRequest,
    });
    const fundedAccount = await client.getAccount(account.id());
    if (!fundedAccount) {
      throw new Error("Account not found");
    }
    return fundedAccount;
  };
  return { fundAccount };
};

export default useFundAccount;
