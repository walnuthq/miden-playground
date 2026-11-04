import type { Account as WasmAccount } from "@miden-sdk/miden-sdk";
import { SendTransaction, useWallet } from "@miden-sdk/miden-wallet-adapter";
import {
  normalizeAccountId,
  useMiden,
  useTransaction,
  useWaitForCommit,
} from "@miden-sdk/react";
import useNetwork from "@/hooks/use-network";
import { MAINNET_FUNDING_AMOUNT, midenFaucetAddress } from "@/lib/constants";
import {
  requestFundingNote,
  waitForConsumableFeeNote,
  waitForFundingNote,
} from "@/lib/miden-faucet";

// Testnet commits a block every few seconds; leave room for a slow one.
const TRANSACTION_COMMIT_TIMEOUT = 60_000;

const useFundAccount = () => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { execute } = useTransaction();
  const { waitForCommit } = useWaitForCommit();
  const { address: breadWalletAddress, requestSend } = useWallet();
  // Mainnet has no faucet: Bread Wallet sends the account its fee asset.
  // Partner Mainnet only creates the accounts on its allowlist (registered
  // with an invite code) and network accounts, so check before Bread pays.
  const fundFromBreadWallet = async (
    account: WasmAccount,
    { isNetworkAccount }: { isNetworkAccount: boolean },
  ) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    if (!isNetworkAccount && !(await client.isAccountAllowed(account.id()))) {
      throw new Error(
        "Partner Mainnet only creates invited accounts: use your Bread Wallet account, or deploy a network account.",
      );
    }
    if (!breadWalletAddress || !requestSend) {
      throw new Error("Connect Bread Wallet to fund the account on Mainnet");
    }
    const feeFaucetId = await client.feeFaucetId();
    await requestSend(
      new SendTransaction(
        breadWalletAddress,
        normalizeAccountId(account.id().toString()),
        midenFaucetAddress(networkId),
        "public",
        MAINNET_FUNDING_AMOUNT,
      ),
    );
    return waitForConsumableFeeNote({
      client,
      accountId: account.id(),
      expectedFaucet: feeFaucetId,
    });
  };
  const fundFromFaucet = async (account: WasmAccount) => {
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
    return waitForFundingNote({
      client,
      networkId,
      noteId,
      expectedFaucet: feeFaucetId,
    });
  };
  // Funds the account with the network's native fee asset so it can pay for its
  // own transactions, then returns the funded account once it is on chain.
  const fundAccount = async (
    account: WasmAccount,
    { isNetworkAccount = false }: { isNetworkAccount?: boolean } = {},
  ) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const fundingNote =
      networkId === "mm"
        ? await fundFromBreadWallet(account, { isNetworkAccount })
        : await fundFromFaucet(account);
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
