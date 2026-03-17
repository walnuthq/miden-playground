import { useState } from "react";
import {
  useWallet,
  type MessageSignerWalletAdapter,
} from "@miden-sdk/miden-wallet-adapter";
import {
  MidenWalletSigner,
  type Multisig,
  type TransactionProposal,
} from "@openzeppelin/miden-multisig-client";
import { type Account } from "@/lib/types/account";
import { wasmAccountToAccount, addressToAccountId } from "@/lib/web-client";
import useWebClient from "@/hooks/use-web-client";
import { initMultisigClient } from "@/lib/multisig-client";
import { useMidenWallet } from "@/hooks/use-miden-wallet";
import { MIDEN_PSM_ENDPOINT_URL } from "@/lib/constants";
import useAccounts from "@/hooks/use-accounts";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import { psmClient } from "@/lib/psm-client";

const useMultisig = () => {
  const [multisig, setMultisig] = useState<Multisig | null>(null);
  const { wallet } = useWallet();
  const { session: midenWalletSession, signBytes } = useMidenWallet(
    (wallet?.adapter as MessageSignerWalletAdapter) ?? null,
  );
  const { midenSdk } = useMidenSdk();
  const { networkId, blockNum, dispatch } = useGlobalContext();
  const { client } = useWebClient();
  const { accounts, newAccount, updateAccount } = useAccounts();
  const createMultisig = async ({
    name,
    threshold,
  }: {
    name: string;
    threshold: number;
  }) => {
    if (!midenWalletSession.commitment || !midenWalletSession.scheme) {
      return;
    }
    const { client: multisigClient, psmCommitment } = await initMultisigClient(
      client,
      MIDEN_PSM_ENDPOINT_URL,
    );
    const signer = new MidenWalletSigner(
      { signBytes },
      midenWalletSession.commitment,
      midenWalletSession.scheme,
    );
    const newMultisig = await multisigClient.create(
      {
        threshold,
        signerCommitments: [signer.commitment],
        psmCommitment,
        signatureScheme: signer.scheme,
      },
      signer,
    );
    await newMultisig.registerOnPsm();
    setMultisig(newMultisig);
    const config = await newMultisig.getAccountConfig();
    if (!newMultisig.account) {
      return;
    }
    const account = wasmAccountToAccount({
      wasmAccount: newMultisig.account,
      name,
      components: ["multisig", "psm", "basic-wallet"],
      multisig: {
        config: {
          ...config,
          vaultBalances: config.vaultBalances.map((vaultBalance) => ({
            ...vaultBalance,
            amount: vaultBalance.amount.toString(),
          })),
        },
        proposals: [],
      },
      networkId,
      updatedAt: blockNum,
      midenSdk,
    });
    newAccount(account);
    return account;
  };
  const loadMultisig = async (accountId: string) => {
    if (!midenWalletSession.commitment || !midenWalletSession.scheme) {
      return;
    }
    if (multisig) {
      return multisig;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const { client: multisigClient } = await initMultisigClient(
      client,
      MIDEN_PSM_ENDPOINT_URL,
    );
    const signer = new MidenWalletSigner(
      { signBytes },
      midenWalletSession.commitment,
      midenWalletSession.scheme,
    );
    dispatch({ type: "TRANSACTION_SUBMITTED" });
    const loadedMultisig = await multisigClient.load(accountId, signer);
    setMultisig(loadedMultisig);
    return loadedMultisig;
  };
  const isMultisigSigner = ({ multisig }: Account) => {
    if (
      !midenWalletSession.commitment ||
      !midenWalletSession.scheme ||
      !multisig
    ) {
      return false;
    }
    return multisig.config.signerCommitments.includes(
      midenWalletSession.commitment,
    );
  };
  const syncMultisig = async (accountId: string) => {
    const previousAccount = accounts.find(({ id }) => id === accountId);
    const multisig = await loadMultisig(accountId);
    if (!previousAccount || !multisig || !multisig.account) {
      return;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    // console.log(multisig);
    // const state = await multisig.fetchState();
    // console.log(state);
    // const localAccount = await client.getAccount(
    //   midenSdk.AccountId.fromHex(accountId),
    // );
    // const account = midenSdk.Account.deserialize(
    //   fromBase64(state.stateDataBase64),
    // );
    // console.log(account.id().toString());
    // console.log(account.nonce().asInt());
    // console.log(account.commitment().toHex());
    // console.log(account.getPublicKeyCommitments().map((w) => w.toHex()));
    // const account3 = wasmAccountToAccount({
    //   wasmAccount: localAccount!,
    //   name: previousAccount.name,
    //   components: previousAccount.components,
    //   networkId,
    //   updatedAt: blockNum,
    //   midenSdk,
    // });
    // const account2 = wasmAccountToAccount({
    //   wasmAccount: account,
    //   name: previousAccount.name,
    //   components: previousAccount.components,
    //   networkId,
    //   updatedAt: blockNum,
    //   midenSdk,
    // });
    //console.log(account2);
    // console.log(account3);
    const { proposals, state, notes, config } = await multisig.syncAll();
    for (const p of proposals) {
      console.log(`${p.id}: ${p.status.type}`);
    }
    console.log("proposals", proposals);
    console.log("state", state);
    console.log("notes", notes);
    const account = wasmAccountToAccount({
      wasmAccount: multisig.account,
      name: previousAccount.name,
      components: previousAccount.components,
      multisig: {
        config: {
          ...config,
          vaultBalances: config.vaultBalances.map((vaultBalance) => ({
            ...vaultBalance,
            amount: vaultBalance.amount.toString(),
          })),
        },
        proposals,
      },
      networkId,
      updatedAt: blockNum,
      midenSdk,
    });
    updateAccount(account);
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const createConsumeNotesProposal = async ({
    multisig,
    noteIds,
  }: {
    multisig: Multisig;
    noteIds: string[];
  }) => {
    const previousAccount = accounts.find(
      ({ id }) => id === multisig.accountId,
    );
    if (!previousAccount || !previousAccount.multisig) {
      return;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const { proposals } = await multisig.createConsumeNotesProposal(noteIds);
    updateAccount({
      ...previousAccount,
      multisig: {
        ...previousAccount.multisig,
        proposals: [...previousAccount.multisig.proposals, ...proposals],
      },
    });
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const createSendProposal = async ({
    multisig,
    recipientId,
    faucetId,
    amount,
  }: {
    multisig: Multisig;
    recipientId: string;
    faucetId: string;
    amount: string;
  }) => {
    const previousAccount = accounts.find(
      ({ id }) => id === multisig.accountId,
    );
    if (!previousAccount || !previousAccount.multisig) {
      return;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const { proposals } = await multisig.createSendProposal(
      recipientId,
      faucetId,
      BigInt(amount),
    );
    updateAccount({
      ...previousAccount,
      multisig: {
        ...previousAccount.multisig,
        proposals: [...previousAccount.multisig.proposals, ...proposals],
      },
    });
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const signTransactionProposal = async ({
    multisig,
    proposal,
  }: {
    multisig: Multisig;
    proposal: TransactionProposal;
  }) => {
    const previousAccount = accounts.find(
      ({ id }) => id === multisig.accountId,
    );
    if (!previousAccount || !previousAccount.multisig) {
      return;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    await multisig.syncTransactionProposals();
    const proposals = await multisig.signTransactionProposal(
      proposal.commitment,
    );
    updateAccount({
      ...previousAccount,
      multisig: { ...previousAccount.multisig, proposals },
    });
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const executeTransactionProposal = async ({
    multisig,
    proposal,
  }: {
    multisig: Multisig;
    proposal: TransactionProposal;
  }) => {
    const previousAccount = accounts.find(
      ({ id }) => id === multisig.accountId,
    );
    if (!previousAccount || !previousAccount.multisig) {
      return;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    await multisig.syncTransactionProposals();
    await multisig.executeTransactionProposal(proposal.commitment);
    const proposals = multisig.listTransactionProposals();
    // updateAccount({
    //   ...previousAccount,
    //   multisig: { ...previousAccount.multisig, proposals },
    // });
    const localAccount = await client.getAccount(
      midenSdk.AccountId.fromHex(multisig.accountId),
    );
    if (!localAccount) {
      dispatch({ type: "TRANSACTION_SUBMITTED" });
      return;
    }
    const account = wasmAccountToAccount({
      wasmAccount: localAccount,
      name: previousAccount.name,
      components: previousAccount.components,
      multisig: {
        config: previousAccount.multisig.config,
        proposals,
      },
      networkId,
      updatedAt: blockNum,
      midenSdk,
    });
    updateAccount(account);
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const isRegisteredOnPsm = async (accountId: string) => {
    if (!midenWalletSession.commitment || !midenWalletSession.scheme) {
      return false;
    }
    try {
      const signer = new MidenWalletSigner(
        { signBytes },
        midenWalletSession.commitment,
        midenWalletSession.scheme,
      );
      psmClient.setSigner(signer);
      await psmClient.getState(accountId);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  };
  const importMultisig = async ({
    name,
    address,
  }: {
    name: string;
    address: string;
  }) => {
    const accountId = addressToAccountId({ address, midenSdk });
    const multisig = await loadMultisig(accountId.toString());
    if (!multisig || !multisig.account) {
      throw new Error("Multisig not found");
    }
    // dispatch({ type: "SUBMITTING_TRANSACTION" });
    const [config, syncSummary] = await Promise.all([
      multisig.getAccountConfig(),
      client.syncState(),
    ]);
    const account = wasmAccountToAccount({
      wasmAccount: multisig.account,
      name,
      components: ["multisig", "psm", "basic-wallet"],
      multisig: {
        config: {
          ...config,
          vaultBalances: config.vaultBalances.map((vaultBalance) => ({
            ...vaultBalance,
            amount: vaultBalance.amount.toString(),
          })),
        },
        proposals: [],
      },
      networkId,
      updatedAt: blockNum,
      midenSdk,
    });
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: {
        account,
        inputNotes: [],
        blockNum: syncSummary.blockNum(),
      },
    });
    // dispatch({ type: "TRANSACTION_SUBMITTED" });
    return account;
  };
  return {
    createMultisig,
    loadMultisig,
    isMultisigSigner,
    syncMultisig,
    createConsumeNotesProposal,
    createSendProposal,
    signTransactionProposal,
    executeTransactionProposal,
    isRegisteredOnPsm,
    importMultisig,
  };
};

export default useMultisig;
