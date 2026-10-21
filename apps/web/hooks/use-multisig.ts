import {
  AccountId as WasmAccountId,
  Address as WasmAddress,
} from "@miden-sdk/miden-sdk/lazy";
import {
  type MessageSignerWalletAdapter,
  useWallet,
} from "@miden-sdk/miden-wallet-adapter";
import { useMiden, useSyncState } from "@miden-sdk/react/lazy";
import {
  AccountInspector,
  MidenWalletSigner,
  type Multisig,
  type Proposal,
} from "@openzeppelin/miden-multisig-client";
import { useState } from "react";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import { useMidenWallet } from "@/hooks/use-miden-wallet";
import useNetwork from "@/hooks/use-network";
import { GUARDIAN_ENDPOINT_URL } from "@/lib/constants";
import createMidenClient from "@/lib/miden-client";
import { initMultisigClient } from "@/lib/multisig-client";
import type { Account } from "@/lib/types/account";
import { wasmAccountToAccount } from "@/lib/web-client";

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
  const { accounts, updateAccount } = useAccounts();
  // Pauses syncing while `run` talks to Miden Guardian and the wallet, which
  // can fail or be rejected at any step.
  const whileSubmitting = async <T>(run: () => Promise<T>) => {
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    try {
      return await run();
    } finally {
      dispatch({ type: "TRANSACTION_SUBMITTED" });
    }
  };
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
    const { commitment, scheme } = midenWalletSession;
    return whileSubmitting(async () => {
      const midenClient = await createMidenClient(networkId);
      const {
        client: multisigClient,
        guardianCommitment,
        guardianPublicKey,
      } = await initMultisigClient({
        midenClient,
        networkId,
        guardianEndpoint: GUARDIAN_ENDPOINT_URL,
        scheme,
      });
      const signer = new MidenWalletSigner({ signBytes }, commitment, scheme);
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
      await newMultisig.syncState();
      if (!newMultisig.account) {
        return;
      }
      const config = AccountInspector.fromAccount(newMultisig.account);
      const account = wasmAccountToAccount({
        wasmAccount: newMultisig.account,
        name,
        components: ["auth-guarded-multisig", "basic-wallet"],
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
      dispatch({
        type: "NEW_ACCOUNT",
        payload: { account },
      });
      return account;
    });
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
    const { commitment, scheme } = midenWalletSession;
    const { multisigClient, signer } = await whileSubmitting(async () => {
      const midenClient = await createMidenClient(networkId);
      const { client: multisigClient } = await initMultisigClient({
        midenClient,
        networkId,
        guardianEndpoint: GUARDIAN_ENDPOINT_URL,
      });
      const signer = new MidenWalletSigner({ signBytes }, commitment, scheme);
      return { multisigClient, signer };
    });
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
    if (!previousAccount?.multisig) {
      return;
    }
    const { multisig: previousMultisig } = previousAccount;
    await whileSubmitting(async () => {
      await multisig.createConsumeNotesProposal(noteIds);
      updateAccount({
        ...previousAccount,
        multisig: {
          ...previousMultisig,
          proposals: multisig.listProposals(),
        },
      });
    });
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
    if (!previousAccount?.multisig) {
      return;
    }
    const { multisig: previousMultisig } = previousAccount;
    await whileSubmitting(async () => {
      await multisig.createP2idProposal(recipientId, faucetId, BigInt(amount));
      updateAccount({
        ...previousAccount,
        multisig: {
          ...previousMultisig,
          proposals: multisig.listProposals(),
        },
      });
    });
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
    if (!previousAccount?.multisig) {
      return;
    }
    const { multisig: previousMultisig } = previousAccount;
    await whileSubmitting(async () => {
      await multisig.signProposal(proposal.id);
      updateAccount({
        ...previousAccount,
        multisig: {
          ...previousMultisig,
          proposals: multisig.listProposals(),
        },
      });
    });
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
    if (!previousAccount?.multisig) {
      return;
    }
    const { multisig: previousMultisig } = previousAccount;
    await whileSubmitting(async () => {
      await multisig.executeProposal(proposal.id);
      // updateAccount({
      //   ...previousAccount,
      //   multisig: { ...previousAccount.multisig, proposals },
      // });
      const localAccount = await client.getAccount(
        WasmAccountId.fromHex(multisig.accountId),
      );
      if (!localAccount) {
        return;
      }
      const account = wasmAccountToAccount({
        wasmAccount: localAccount,
        name: previousAccount.name,
        components: previousAccount.components,
        multisig: {
          config: previousMultisig.config,
          proposals: multisig.listProposals(),
        },
        updatedAt: lastSyncTime,
      });
      updateAccount(account);
    });
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
    if (!multisig?.account) {
      throw new Error("Guardian wallet not found on Miden Guardian.");
    }
    return whileSubmitting(async () => {
      await multisig.syncState();
      const { account: multisigAccount } = multisig;
      if (!multisigAccount) {
        throw new Error("Guardian wallet not found on Miden Guardian.");
      }
      const config = AccountInspector.fromAccount(multisigAccount);
      const account = wasmAccountToAccount({
        wasmAccount: multisigAccount,
        name,
        components: ["auth-guarded-multisig", "basic-wallet"],
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
      return account;
    });
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
