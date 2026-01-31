import { useWallet } from "@demox-labs/miden-wallet-adapter";
import {
  clientGetAccountByAddress,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
  clientNewWallet,
  clientNewFaucet,
  clientDeployAccount,
  storageMode,
  addressToAccountId,
} from "@/lib/web-client";
import { type Account as WasmAccountType } from "@demox-labs/miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import {
  type AccountStorageMode,
  type AccountType,
  type Account,
  basicWalletAccount,
  midenFaucetAccount,
  getRoutingParametersPart,
  getIdentifierPart,
} from "@/lib/types/account";
import { type Component } from "@/lib/types/component";
import useScripts from "@/hooks/use-scripts";
import {
  MIDEN_FAUCET_ADDRESS,
  COUNTER_CONTRACT_ADDRESS,
} from "@/lib/constants";
import useWebClient from "@/hooks/use-web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { verifyAccountComponentsFromPackageIds } from "@/lib/api";
import { toBase64 } from "@/lib/utils";
import { defaultComponentIds } from "@/lib/types/default-components";
import type { FungibleAsset } from "@/lib/types/asset";
// import { useParaMiden } from "@/lib/para-miden";

const useAccounts = () => {
  const { address: midenWalletAddress, requestAssets } = useWallet();
  // const { accountId: paraWalletAccountId } = useParaMiden();
  const { midenSdk } = useMidenSdk();
  const {
    networkId,
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    deployAccountDialogOpen,
    verifyAccountComponentDialogOpen,
    verifyAccountComponentDialogAccountId,
    accounts,
    tutorialId,
    blockNum,
    dispatch,
  } = useGlobalContext();
  const { client } = useWebClient();
  const { scripts } = useScripts();
  const wallets = accounts.filter((account) =>
    account.components.includes("basic-wallet"),
  );
  const faucets = accounts.filter((account) => account.isFaucet);
  const connectedWallet = wallets.find(
    ({ /*id,*/ address }) => address === midenWalletAddress, // || id === paraWalletAccountId,
  );
  const newWallet = async ({
    name,
    storageMode,
  }: {
    name: string;
    storageMode: AccountStorageMode;
  }) => {
    const wallet = await clientNewWallet({
      client,
      storageMode,
      mutable: true,
      midenSdk,
    });
    const account = wasmAccountToAccount({
      wasmAccount: wallet,
      name,
      networkId,
      updatedAt: blockNum,
      midenSdk,
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
    const faucet = await clientNewFaucet({
      client,
      storageMode,
      nonFungible: false,
      tokenSymbol,
      decimals,
      maxSupply,
      midenSdk,
    });
    const account = wasmAccountToAccount({
      wasmAccount: faucet,
      name,
      networkId,
      updatedAt: blockNum,
      midenSdk,
    });
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account },
    });
    return account;
  };
  const importAccountByAddress = async ({
    name,
    address,
    fungibleAssets,
  }: {
    name: string;
    address: string;
    fungibleAssets?: FungibleAsset[];
  }) => {
    // TODO mock importing Miden Faucet
    if (address === MIDEN_FAUCET_ADDRESS) {
      const account = midenFaucetAccount();
      dispatch({
        type: "IMPORT_ACCOUNT",
        payload: { account, inputNotes: [], blockNum },
      });
      return account;
    }
    const syncSummary = await client.syncState();
    let wasmAccount: WasmAccountType | null = null;
    try {
      wasmAccount = await clientGetAccountByAddress({
        client,
        address,
        midenSdk,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      if (address === midenWalletAddress) {
        const accountId = addressToAccountId({ address, midenSdk });
        const accountStorageMode = storageMode(accountId);
        const account = {
          ...basicWalletAccount({ storageMode: accountStorageMode }),
          id: accountId.toString(),
          name: accountStorageMode === "private" ? "Priv Account 1" : name,
          address,
          identifier: getIdentifierPart(address),
          routingParameters: getRoutingParametersPart(address),
          isNew: true,
          fungibleAssets: fungibleAssets ?? [],
        };
        dispatch({
          type: "IMPORT_ACCOUNT",
          payload: {
            account,
            inputNotes: [],
            blockNum: syncSummary.blockNum(),
          },
        });
        return account;
      }
    }
    if (!wasmAccount) {
      throw new Error("Account not found");
    }
    const consumableNotes = await clientGetConsumableNotes({
      client,
      accountId: wasmAccount.id().toString(),
      midenSdk,
    });
    const account = wasmAccountToAccount({
      wasmAccount,
      name,
      networkId,
      updatedAt: syncSummary.blockNum(),
      consumableNoteIds: consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString(),
      ),
      midenSdk,
    });
    // if (fungibleAssets) {
    //   account.fungibleAssets = fungibleAssets;
    // }
    if (
      address === COUNTER_CONTRACT_ADDRESS &&
      tutorialId === "interact-with-the-counter-contract"
    ) {
      account.components = ["no-auth", "counter-value-contract"];
    }
    const inputNotes = consumableNotes.map((consumableNote) =>
      wasmInputNoteToInputNote({
        record: consumableNote.inputNoteRecord(),
        scripts,
        midenSdk,
      }),
    );
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: {
        account,
        inputNotes,
        blockNum: syncSummary.blockNum(),
      },
    });
    return account;
  };
  const importConnectedWallet = async () => {
    if (networkId !== "mtst" || connectedWallet) {
      return;
    }
    if (midenWalletAddress) {
      const assets = await requestAssets?.();
      await importAccountByAddress({
        name: "Miden Account 1",
        address: midenWalletAddress,
        fungibleAssets: assets
          ? assets.map(({ faucetId, amount }) => ({
              faucetId: addressToAccountId({
                address: faucetId,
                midenSdk,
              }).toString(),
              amount,
            }))
          : [],
      });
    }
    // if (paraWalletAccountId) {
    //   const paraWalletAddress = accountIdToAddress({
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
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    const syncSummary = await client.syncState();
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
      midenSdk,
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
      networkId,
      updatedAt: syncSummary.blockNum(),
      midenSdk,
    });
    if (verify && !tutorialId) {
      verifyAccountComponentsFromPackageIds({
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
  const openImportAccountDialog = () =>
    dispatch({
      type: "OPEN_IMPORT_ACCOUNT_DIALOG",
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
  return {
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    deployAccountDialogOpen,
    verifyAccountComponentDialogOpen,
    verifyAccountComponentDialogAccountId,
    accounts,
    wallets,
    faucets,
    connectedWallet: networkId !== "mlcl" ? connectedWallet : undefined,
    newWallet,
    newFaucet,
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
  };
};

export default useAccounts;
