import { useState } from "react";
import {
  Address as WasmAddress,
  AccountId as WasmAccountId,
} from "@miden-sdk/miden-sdk";
import { useMiden, useSyncState } from "@miden-sdk/react";
import {
  useWallet,
  type MessageSignerWalletAdapter,
} from "@miden-sdk/miden-wallet-adapter";
import {
  MidenWalletSigner,
  AccountInspector,
  type Multisig,
  type Proposal,
} from "@openzeppelin/miden-multisig-client";
import type { Account } from "@/lib/types/account";
import { wasmAccountToAccount } from "@/lib/web-client";
import { initMultisigClient } from "@/lib/multisig-client";
import { useMidenWallet } from "@/hooks/use-miden-wallet";
import { GUARDIAN_ENDPOINT_URL } from "@/lib/constants";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import useNetwork from "@/hooks/use-network";
import createMidenClient from "@/lib/miden-client";

const useMultisig = () => {
  const [multisig, setMultisig] = useState<Multisig | null>(null);
  const { networkId } = useNetwork();
  const { wallet } = useWallet();
  const { session: midenWalletSession, signBytes } = useMidenWallet(
    (wallet?.adapter as MessageSignerWalletAdapter) ?? null,
  );
  const { dispatch } = useGlobalContext();
  const { client } = useMiden();
  const { lastSyncTime } = useSyncState();
  const { accounts, newAccount, updateAccount } = useAccounts();
  const createMultisig = async ({
    name,
    threshold,
  }: {
    name: string;
    threshold: number;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    if (!midenWalletSession.commitment || !midenWalletSession.scheme) {
      return;
    }
    const midenClient = await createMidenClient(networkId);
    const {
      client: multisigClient,
      guardianCommitment,
      guardianPublicKey,
    } = await initMultisigClient({
      midenClient,
      guardianEndpoint: GUARDIAN_ENDPOINT_URL,
    });
    const signer = new MidenWalletSigner(
      { signBytes },
      midenWalletSession.commitment,
      midenWalletSession.scheme,
    );
    const newMultisig = await multisigClient.create(
      {
        threshold,
        signerCommitments: [signer.commitment],
        guardianCommitment,
        guardianPublicKey,
        signatureScheme: signer.scheme,
      },
      signer,
    );
    await newMultisig.registerOnGuardian();
    setMultisig(newMultisig);
    const state = await newMultisig.syncState();
    const config = AccountInspector.fromBase64(state.stateDataBase64);
    if (!newMultisig.account) {
      return;
    }
    const account = wasmAccountToAccount({
      wasmAccount: newMultisig.account,
      name,
      components: ["auth-multisig-guardian", "basic-wallet"],
      multisig: {
        config: {
          ...config,
          vaultBalances: config.vaultBalances.map((vaultBalance) => ({
            ...vaultBalance,
            amount: vaultBalance.amount.toString(),
          })),
        },
        proposals: newMultisig.listProposals(),
      },
      updatedAt: lastSyncTime,
    });
    newAccount(account);
    return account;
  };
  const loadMultisig = async (accountId: string) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    if (!midenWalletSession.commitment || !midenWalletSession.scheme) {
      return;
    }
    if (multisig) {
      return multisig;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const midenClient = await createMidenClient(networkId);
    const { client: multisigClient } = await initMultisigClient({
      midenClient,
      guardianEndpoint: GUARDIAN_ENDPOINT_URL,
    });
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
  // const syncMultisig = async (accountId: string) => {
  //   const previousAccount = accounts.find(({ id }) => id === accountId);
  //   const multisig = await loadMultisig(accountId);
  //   if (!previousAccount || !multisig || !multisig.account) {
  //     return;
  //   }
  //   dispatch({ type: "SUBMITTING_TRANSACTION" });
  //   const { proposals, state, notes, config } = await multisig.syncAll();
  //   for (const p of proposals) {
  //     console.log(`${p.id}: ${p.status.type}`);
  //   }
  //   console.log("proposals", proposals);
  //   console.log("state", state);
  //   console.log("notes", notes);
  //   const account = wasmAccountToAccount({
  //     wasmAccount: multisig.account,
  //     name: previousAccount.name,
  //     components: previousAccount.components,
  //     multisig: {
  //       config: {
  //         ...config,
  //         vaultBalances: config.vaultBalances.map((vaultBalance) => ({
  //           ...vaultBalance,
  //           amount: vaultBalance.amount.toString(),
  //         })),
  //       },
  //       proposals,
  //     },
  //     networkId,
  //     updatedAt: blockNum,
  //     midenSdk,
  //   });
  //   updateAccount(account);
  //   dispatch({ type: "TRANSACTION_SUBMITTED" });
  // };
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
    await multisig.createConsumeNotesProposal(noteIds);
    updateAccount({
      ...previousAccount,
      multisig: {
        ...previousAccount.multisig,
        proposals: multisig.listProposals(),
      },
    });
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const createP2idProposal = async ({
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
    await multisig.createP2idProposal(recipientId, faucetId, BigInt(amount));
    updateAccount({
      ...previousAccount,
      multisig: {
        ...previousAccount.multisig,
        proposals: multisig.listProposals(),
      },
    });
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const signProposal = async ({
    multisig,
    proposal,
  }: {
    multisig: Multisig;
    proposal: Proposal;
  }) => {
    const previousAccount = accounts.find(
      ({ id }) => id === multisig.accountId,
    );
    if (!previousAccount || !previousAccount.multisig) {
      return;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    await multisig.signProposal(proposal.id);
    updateAccount({
      ...previousAccount,
      multisig: {
        ...previousAccount.multisig,
        proposals: multisig.listProposals(),
      },
    });
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const executeProposal = async ({
    multisig,
    proposal,
  }: {
    multisig: Multisig;
    proposal: Proposal;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const previousAccount = accounts.find(
      ({ id }) => id === multisig.accountId,
    );
    if (!previousAccount || !previousAccount.multisig) {
      return;
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    await multisig.executeProposal(proposal.id);
    // updateAccount({
    //   ...previousAccount,
    //   multisig: { ...previousAccount.multisig, proposals },
    // });
    const localAccount = await client.getAccount(
      WasmAccountId.fromHex(multisig.accountId),
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
        proposals: multisig.listProposals(),
      },
      updatedAt: lastSyncTime,
    });
    updateAccount(account);
    dispatch({ type: "TRANSACTION_SUBMITTED" });
  };
  const importMultisig = async ({
    name,
    address,
  }: {
    name: string;
    address: string;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const accountId = WasmAddress.fromBech32(address).accountId();
    const multisig = await loadMultisig(accountId.toString());
    if (!multisig || !multisig.account) {
      throw new Error("Multisig not found");
    }
    // dispatch({ type: "SUBMITTING_TRANSACTION" });
    const state = await multisig.syncState();
    const config = AccountInspector.fromBase64(state.stateDataBase64);
    const account = wasmAccountToAccount({
      wasmAccount: multisig.account,
      name,
      components: ["auth-multisig-guardian", "basic-wallet"],
      multisig: {
        config: {
          ...config,
          vaultBalances: config.vaultBalances.map((vaultBalance) => ({
            ...vaultBalance,
            amount: vaultBalance.amount.toString(),
          })),
        },
        proposals: multisig.listProposals(),
      },
      updatedAt: lastSyncTime,
    });
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: { account },
    });
    // dispatch({ type: "TRANSACTION_SUBMITTED" });
    return account;
  };
  return {
    createMultisig,
    loadMultisig,
    isMultisigSigner,
    // syncMultisig,
    createConsumeNotesProposal,
    createP2idProposal,
    signProposal,
    executeProposal,
    importMultisig,
  };
};

export default useMultisig;
