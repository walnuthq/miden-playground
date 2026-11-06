import type { Account as WasmAccount } from "@miden-sdk/miden-sdk";
import { SendTransaction, useWallet } from "@miden-sdk/miden-wallet-adapter";
import {
  normalizeAccountId,
  useMiden,
  useTransaction,
  useWaitForCommit,
} from "@miden-sdk/react";
import useGlobalContext from "@/components/global-context/hook";
import useNetwork from "@/hooks/use-network";
import { MAINNET_FUNDING_AMOUNT, midenFaucetAddress } from "@/lib/constants";
import {
  requestFundingNote,
  waitForConsumableFeeNote,
  waitForFundingNote,
} from "@/lib/miden-faucet";
import {
  endMainnetFunding,
  type MainnetFunding,
  startMainnetFunding,
  workspaceLeft,
} from "@/lib/utils/workspace-guard";

// Testnet commits a block every few seconds; leave room for a slow one.
const TRANSACTION_COMMIT_TIMEOUT = 60_000;

const useFundAccount = () => {
  const { networkId } = useNetwork();
  const { workspaceRun } = useGlobalContext();
  const { client } = useMiden();
  const { execute } = useTransaction();
  const { waitForCommit } = useWaitForCommit();
  const { address: breadWalletAddress, requestSend } = useWallet();
  // Mainnet has no faucet: Bread Wallet sends the account its fee asset.
  // Partner Mainnet only creates the accounts on its allowlist (registered
  // with an invite code) and network accounts, so check before Bread pays.
  const fundFromBreadWallet = async (
    account: WasmAccount,
    {
      isNetworkAccount,
      funding,
    }: { isNetworkAccount: boolean; funding: MainnetFunding },
  ) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    // A deploy goes on after a switch that started before its funding: never
    // ask Bread to pay an account that's gone with its store.
    const refuseIfLeft = () => {
      if (funding.abandoned || workspaceLeft(workspaceRun)) {
        throw new Error("You left the workspace of this account.");
      }
    };
    if (!isNetworkAccount && !(await client.isAccountAllowed(account.id()))) {
      throw new Error(
        "Partner Mainnet only creates invited accounts: use your Bread Wallet account, or deploy a network account.",
      );
    }
    if (!breadWalletAddress || !requestSend) {
      throw new Error("Connect Bread Wallet to fund the account on Mainnet");
    }
    const feeFaucetId = await client.feeFaucetId();
    refuseIfLeft();
    await requestSend(
      new SendTransaction(
        breadWalletAddress,
        normalizeAccountId(account.id().toString()),
        midenFaucetAddress(networkId),
        "public",
        MAINNET_FUNDING_AMOUNT,
      ),
    );
    refuseIfLeft();
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
    // Until the account is on chain, leaving loses it and what Bread paid it.
    const funding = networkId === "mm" ? startMainnetFunding() : null;
    try {
      const fundingNote = funding
        ? await fundFromBreadWallet(account, { isNetworkAccount, funding })
        : await fundFromFaucet(account);
      return await consumeFundingNote(account, fundingNote);
    } finally {
      if (funding) {
        endMainnetFunding(funding);
      }
    }
  };
  const consumeFundingNote = async (
    account: WasmAccount,
    fundingNote: Awaited<ReturnType<typeof fundFromFaucet>>,
  ) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
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
