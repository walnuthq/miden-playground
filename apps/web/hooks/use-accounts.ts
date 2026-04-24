import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import {
  wasmAccountToAccount,
  clientDeployAccount,
  storageMode,
} from "@/lib/web-client";
import { /*AuthScheme,*/ Address as WasmAddress } from "@miden-sdk/miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import type {
  AccountStorageMode,
  AccountType,
  Account,
} from "@/lib/types/account";
import {
  basicWalletAccount,
  getRoutingParametersPart,
  getIdentifierPart,
} from "@/lib/utils/account";
import type { Component } from "@/lib/types/component";
import useScripts from "@/hooks/use-scripts";
import { counterContractAddress } from "@/lib/constants";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { verifyAccountComponentsFromPackageIds } from "@/lib/api";
import { toBase64 } from "@/lib/utils";
import { defaultComponentIds } from "@/lib/types/default-components";
// import { useParaMiden } from "@/lib/para-miden";
import {
  useSyncState,
  useCreateWallet,
  useCreateFaucet,
  useImportAccount,
  useMiden,
} from "@miden-sdk/react";
import useNetwork from "@/hooks/use-network";

const useAccounts = () => {
  const { address: midenWalletAddress, requestAssets } = useWallet();
  // const { accountId: paraWalletAccountId } = useParaMiden();
  const { networkId } = useNetwork();
  const {
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    importAccountDialogMultisig,
    deployAccountDialogOpen,
    verifyAccountComponentDialogOpen,
    verifyAccountComponentDialogAccountId,
    deployMultisigDialogOpen,
    accounts,
    tutorialId,
    dispatch,
  } = useGlobalContext();
  const { lastSyncTime } = useSyncState();
  const { client } = useMiden();
  const { createWallet } = useCreateWallet();
  const { createFaucet } = useCreateFaucet();
  const { importAccount } = useImportAccount();
  const { scripts } = useScripts();
  const wallets = accounts.filter((account) =>
    account.components.includes("basic-wallet"),
  );
  const multisigs = wallets.filter((wallet) => !!wallet.multisig);
  const faucets = accounts.filter((account) => account.isFaucet);
  const connectedWallet = wallets.find(
    ({ /*id,*/ address }) => address === midenWalletAddress, // || id === paraWalletAccountId,
  );
  const isAuthorized = (targetAccount: Account) => {
    const isTutorial =
      tutorialId === "create-and-fund-wallet" ||
      tutorialId === "transfer-assets-between-wallets";
    return (
      networkId === "mmck" ||
      isTutorial ||
      connectedWallet?.id === targetAccount.id ||
      targetAccount.components.includes("auth-no-auth") ||
      !!targetAccount.multisig
    );
  };
  const newWallet = async ({
    name,
    storageMode,
  }: {
    name: string;
    storageMode: AccountStorageMode;
  }) => {
    const wallet = await createWallet({
      storageMode,
      authScheme: 2, // AuthScheme.AuthRpoFalcon512
    });
    const account = wasmAccountToAccount({
      wasmAccount: wallet,
      name,
      updatedAt: lastSyncTime,
    });
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account },
    });
    return account;
  };
  const newFaucet = async ({
    name,
    storageMode,
    tokenSymbol,
    decimals,
    maxSupply,
  }: {
    name: string;
    storageMode: AccountStorageMode;
    tokenSymbol: string;
    decimals: number;
    maxSupply: bigint;
  }) => {
    const faucet = await createFaucet({
      tokenSymbol,
      decimals,
      maxSupply,
      storageMode,
      authScheme: 2, // AuthScheme.AuthRpoFalcon512
    });
    const account = wasmAccountToAccount({
      wasmAccount: faucet,
      name,
      updatedAt: lastSyncTime,
    });
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account },
    });
    return account;
  };
  const newAccount = (account: Account) => {
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account },
    });
    return account;
  };
  const deleteAccount = async (accountId: string) => {
    const account = accounts.find(({ id }) => id === accountId);
    if (!account) {
      throw new Error("Error: Account not found");
    }
    dispatch({ type: "DELETE_ACCOUNT", payload: { accountId } });
    return account;
  };
  const importAccountByAddress = async ({
    name,
    address,
  }: {
    name: string;
    address: string;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const wasmAccount = await importAccount({ type: "id", accountId: address });
    const account = wasmAccountToAccount({
      wasmAccount,
      name,
      updatedAt: lastSyncTime,
    });
    if (
      address === counterContractAddress(networkId) &&
      tutorialId === "interact-with-the-counter-contract"
    ) {
      account.components = ["auth-no-auth", "counter-value-contract"];
    }
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: {
        account,
        inputNotes: [],
      },
    });
    return account;
  };
  const importConnectedWallet = async () => {
    if (connectedWallet) {
      return;
    }
    if (midenWalletAddress) {
      const assets = await requestAssets?.();
      const fungibleAssets = assets
        ? assets.map(({ faucetId, amount }) => ({
            faucetId: WasmAddress.fromBech32(faucetId).accountId().toString(),
            amount,
          }))
        : [];
      const accountId = WasmAddress.fromBech32(midenWalletAddress).accountId();
      const accountStorageMode = storageMode(accountId);
      const name =
        accountStorageMode === "private" ? "Priv Account 1" : "Miden Account 1";
      try {
        const wasmAccount = await importAccount({ type: "id", accountId });
        const account = wasmAccountToAccount({
          wasmAccount,
          name,
          updatedAt: lastSyncTime,
        });
        dispatch({
          type: "IMPORT_ACCOUNT",
          payload: {
            account,
            inputNotes: [],
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        const account = {
          ...basicWalletAccount({ storageMode: accountStorageMode }),
          id: accountId.toString(),
          name,
          address: midenWalletAddress,
          identifier: getIdentifierPart(midenWalletAddress),
          routingParameters: getRoutingParametersPart(midenWalletAddress),
          fungibleAssets,
        };
        dispatch({
          type: "IMPORT_ACCOUNT",
          payload: {
            account,
            inputNotes: [],
          },
        });
      }
    }
    // if (paraWalletAccountId) {
    //   const paraWalletAddress = n({
    //     accountId: paraWalletAccountId,
    //     networkId,
    //     midenSdk,
    //   });
    //   await importAccountByAddress({
    //     name: "Para Wallet",
    //     address: paraWalletAddress,
    //   });
    // }
  };
  const deployAccount = async ({
    name,
    accountType,
    storageMode,
    components,
    verify = true,
  }: {
    name: string;
    accountType: AccountType;
    storageMode: AccountStorageMode;
    components: Component[];
    verify?: boolean;
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const componentScriptIds = components.map(({ scriptId }) => scriptId);
    const componentScripts = scripts.filter(({ id }) =>
      componentScriptIds.includes(id),
    );
    const wasmAccount = await clientDeployAccount({
      client,
      accountType,
      storageMode,
      components,
      scripts: componentScripts,
    });
    const packageIds = componentScriptIds.filter(
      (id) => !defaultScriptIds.includes(id),
    );
    const account = wasmAccountToAccount({
      wasmAccount,
      name,
      components: components
        .filter(({ id }) => (verify ? true : defaultComponentIds.includes(id)))
        .map(({ id }) => id),
      updatedAt: lastSyncTime,
    });
    if (verify && !tutorialId) {
      verifyAccountComponentsFromPackageIds({
        networkId,
        accountId: account.id,
        identifier: account.identifier,
        account: toBase64(wasmAccount.serialize()),
        packageIds,
      });
    }
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account },
    });
    return account;
  };
  const updateAccount = (account: Account) =>
    dispatch({ type: "UPDATE_ACCOUNT", payload: { account } });
  const openCreateWalletDialog = () =>
    dispatch({
      type: "OPEN_CREATE_WALLET_DIALOG",
    });
  const closeCreateWalletDialog = () =>
    dispatch({
      type: "CLOSE_CREATE_WALLET_DIALOG",
    });
  const openCreateFaucetDialog = () =>
    dispatch({
      type: "OPEN_CREATE_FAUCET_DIALOG",
    });
  const closeCreateFaucetDialog = () =>
    dispatch({
      type: "CLOSE_CREATE_FAUCET_DIALOG",
    });
  const openImportAccountDialog = (multisig = false) =>
    dispatch({
      type: "OPEN_IMPORT_ACCOUNT_DIALOG",
      payload: { multisig },
    });
  const closeImportAccountDialog = () =>
    dispatch({
      type: "CLOSE_IMPORT_ACCOUNT_DIALOG",
    });
  const openDeployAccountDialog = () =>
    dispatch({
      type: "OPEN_DEPLOY_ACCOUNT_DIALOG",
    });
  const closeDeployAccountDialog = () =>
    dispatch({
      type: "CLOSE_DEPLOY_ACCOUNT_DIALOG",
    });
  const openVerifyAccountComponentDialog = (accountId: string) =>
    dispatch({
      type: "OPEN_VERIFY_ACCOUNT_COMPONENT_DIALOG",
      payload: { accountId },
    });
  const closeVerifyAccountComponentDialog = () =>
    dispatch({
      type: "CLOSE_VERIFY_ACCOUNT_COMPONENT_DIALOG",
    });
  const openDeployMultisigDialog = () =>
    dispatch({
      type: "OPEN_DEPLOY_MULTISIG_DIALOG",
    });
  const closeDeployMultisigDialog = () =>
    dispatch({
      type: "CLOSE_DEPLOY_MULTISIG_DIALOG",
    });
  return {
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    importAccountDialogMultisig,
    deployAccountDialogOpen,
    verifyAccountComponentDialogOpen,
    verifyAccountComponentDialogAccountId,
    deployMultisigDialogOpen,
    accounts,
    wallets,
    multisigs,
    faucets,
    connectedWallet: networkId !== "mmck" ? connectedWallet : undefined,
    isAuthorized,
    newWallet,
    newFaucet,
    newAccount,
    deleteAccount,
    importAccountByAddress,
    importConnectedWallet,
    deployAccount,
    updateAccount,
    openCreateWalletDialog,
    closeCreateWalletDialog,
    openCreateFaucetDialog,
    closeCreateFaucetDialog,
    openImportAccountDialog,
    closeImportAccountDialog,
    openDeployAccountDialog,
    closeDeployAccountDialog,
    openVerifyAccountComponentDialog,
    closeVerifyAccountComponentDialog,
    openDeployMultisigDialog,
    closeDeployMultisigDialog,
  };
};

export default useAccounts;
