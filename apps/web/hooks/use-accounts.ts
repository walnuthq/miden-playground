import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import {
  wasmAccountToAccount,
  clientDeployAccount,
  storageMode,
} from "@/lib/web-client";
import {
  Address as WasmAddress,
  AccountId as WasmAccountId,
} from "@miden-sdk/miden-sdk/lazy";
import useGlobalContext from "@/components/global-context/hook";
import {
  type AccountStorageMode,
  type Account,
  AuthScheme,
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
import { defaultComponentIds } from "@/lib/types/default-components";
import { useParaWallet } from "@/components/providers/para-wallet-context";
import {
  useSyncState,
  useCreateWallet,
  useCreateFaucet,
  useImportAccount,
  useMiden,
} from "@miden-sdk/react/lazy";
import useNetwork from "@/hooks/use-network";
import useFundAccount from "@/hooks/use-fund-account";

const useAccounts = () => {
  const { address: midenWalletAddress, requestAssets } = useWallet();
  const paraWallet = useParaWallet();
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
  const { fundAccount } = useFundAccount();
  const { scripts } = useScripts();
  const wallets = accounts.filter(
    (account) =>
      account.components.includes("basic-wallet") &&
      !account.components.includes("fungible-faucet"),
  );
  const multisigs = wallets.filter((wallet) => !!wallet.multisig);
  const faucets = accounts.filter((account) => account.isFaucet);
  const breadWallet = midenWalletAddress
    ? wallets.find(({ address }) => address === midenWalletAddress)
    : undefined;
  const paraWalletAccount = paraWallet?.accountId
    ? wallets.find(({ id }) => id === paraWallet.accountId)
    : undefined;
  const connectedWallet = breadWallet ?? paraWalletAccount;
  // Para Wallet transactions go through the Para client, Bread Wallet's
  // through the extension.
  const isParaWallet = (account: Account) =>
    !!paraWalletAccount && account.id === paraWalletAccount.id;
  const isConnectedWallet = (account: Account) =>
    account.id === breadWallet?.id || isParaWallet(account);
  const needsConnectedWalletImport =
    (!!midenWalletAddress && !breadWallet) ||
    (!!paraWallet?.accountId && !paraWalletAccount);
  const isAuthorized = (targetAccount: Account) => {
    const isTutorial =
      tutorialId === "create-and-fund-wallet" ||
      tutorialId === "transfer-assets-between-wallets";
    return (
      networkId === "mmck" ||
      isTutorial ||
      isConnectedWallet(targetAccount) ||
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
      authScheme: AuthScheme.AuthRpoFalcon512,
    });
    const fundedWallet = await fundAccount(wallet);
    const account = wasmAccountToAccount({
      wasmAccount: fundedWallet,
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
      storageMode,
      tokenName: tokenSymbol,
      tokenSymbol,
      decimals,
      maxSupply,
      authScheme: AuthScheme.AuthRpoFalcon512,
    });
    const fundedFaucet = await fundAccount(faucet);
    const account = wasmAccountToAccount({
      wasmAccount: fundedFaucet,
      name,
      updatedAt: lastSyncTime,
    });
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
      account.components = [
        "auth-no-auth",
        "basic-wallet",
        "counter-value-contract",
      ];
    }
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: { account },
    });
    return account;
  };
  const importParaWallet = async () => {
    if (!client || !paraWallet?.accountId || paraWalletAccount) {
      return;
    }
    // The Para client set the account up in the store it shares with the
    // app's client, so either can read it.
    const wasmAccount =
      (await client.getAccount(WasmAccountId.fromHex(paraWallet.accountId))) ??
      (await paraWallet.client?.accounts.get(paraWallet.accountId));
    if (!wasmAccount) {
      return;
    }
    const account = wasmAccountToAccount({
      wasmAccount,
      name: "Para Wallet",
      updatedAt: lastSyncTime,
    });
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: { account },
    });
  };
  const importConnectedWallet = async () => {
    await importParaWallet();
    if (breadWallet) {
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
      const name = "Bread Wallet";
      // const name =
      //   accountStorageMode === "private" ? "Priv Account 1" : "Miden Account 1";
      try {
        const wasmAccount = await importAccount({ type: "id", accountId });
        const account = wasmAccountToAccount({
          wasmAccount,
          name,
          updatedAt: lastSyncTime,
        });
        dispatch({
          type: "IMPORT_ACCOUNT",
          payload: { account },
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
          isNew: fungibleAssets.length === 0,
          // TODO how to determine components for imported wallet?
          // For now, assume it's always a multisig wallet
          components: ["auth-guarded-multisig", "basic-wallet"],
        };
        dispatch({
          type: "IMPORT_ACCOUNT",
          payload: { account },
        });
      }
    }
  };
  const deployAccount = async ({
    name,
    storageMode,
    components,
    verify = true,
  }: {
    name: string;
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
      storageMode,
      components,
      scripts: componentScripts,
    });
    const fundedAccount = await fundAccount(wasmAccount);
    const packageIds = componentScriptIds.filter(
      (id) => !defaultScriptIds.includes(id),
    );
    const account = wasmAccountToAccount({
      wasmAccount: fundedAccount,
      name,
      components: [
        "basic-wallet",
        ...components
          .filter(({ id }) =>
            verify ? true : defaultComponentIds.includes(id),
          )
          .map(({ id }) => id),
      ],
      updatedAt: lastSyncTime,
    });
    if (verify && !tutorialId) {
      verifyAccountComponentsFromPackageIds({
        networkId,
        accountId: account.id,
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
    isParaWallet,
    isConnectedWallet,
    needsConnectedWalletImport,
    isAuthorized,
    newWallet,
    newFaucet,
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
