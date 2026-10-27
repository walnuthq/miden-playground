import type { Account as WasmAccount } from "@miden-sdk/miden-sdk/lazy";
import {
  useMiden,
  useTransaction,
  useWaitForCommit,
} from "@miden-sdk/react/lazy";
import useNetwork from "@/hooks/use-network";
import { requestFundingNote, waitForFundingNote } from "@/lib/miden-faucet";

// Testnet commits a block every few seconds; leave room for a slow one.
const TRANSACTION_COMMIT_TIMEOUT = 60_000;

const useFundAccount = () => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { execute } = useTransaction();
  const { waitForCommit } = useWaitForCommit();
  // Funds the account with the network's native fee asset so it can pay for its
  // own transactions, then returns the funded account once it is on chain.
  const fundAccount = async (account: WasmAccount) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const [{ noteId }, feeFaucetId] = await Promise.all([
      requestFundingNote({
        networkId,
        recipient: account.id(),
      }),
      client.feeFaucetId(),
    ]);
    const fundingNote = await waitForFundingNote({
      client,
      networkId,
      noteId,
      expectedFaucet: feeFaucetId,
    });
    const transactionRequest = await client.newConsumeTransactionRequest(
      [fundingNote.toNote()],
      account.id(),
    );
    const { transactionId } = await execute({
      accountId: account.id(),
      request: transactionRequest,
    });
    // A new account only exists on chain once this transaction is committed:
    // until then, anything that fetches it from the node (contract
    // verification, foreign procedure invocation) gets "account not found".
    await waitForCommit(transactionId, {
      timeoutMs: TRANSACTION_COMMIT_TIMEOUT,
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
