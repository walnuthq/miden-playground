import { useWallet } from "@demox-labs/miden-wallet-adapter";
import {
  clientGetAccountByAddress,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
  webClient,
  clientNewWallet,
  clientNewFaucet,
  clientImportNewWallet,
  clientDeployAccount,
} from "@/lib/web-client";
import useGlobalContext from "@/components/global-context/hook";
import { type AccountStorageMode, type AccountType } from "@/lib/types/account";
import { type Component } from "@/lib/types/component";
import useScripts from "@/hooks/use-scripts";
import {
  BASIC_WALLET_CODE,
  COUNTER_CONTRACT_CODE,
  FUNGIBLE_FAUCET_CODE,
} from "@/lib/constants";
import { counterMapContractMasm } from "@/lib/types/default-scripts/counter-map-contract";

const useAccounts = () => {
  const {
    networkId,
    serializedMockChain,
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    deployAccountDialogOpen,
    accounts,
    tutorialId,
    dispatch,
  } = useGlobalContext();
  const { accountId: connectedWalletAddress } = useWallet();
  const { scripts } = useScripts();
  const wallets = accounts.filter((account) => account.isWallet);
  const faucets = accounts.filter((account) => account.isFaucet);
  const newWallet = async ({
    name,
    storageMode,
  }: {
    name: string;
    storageMode: AccountStorageMode;
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const wallet = await clientNewWallet(client, {
      storageMode,
      mutable: true,
    });
    const syncSummary = await client.syncState();
    const account = await wasmAccountToAccount({
      wasmAccount: wallet,
      name,
      networkId,
      updatedAt: syncSummary.blockNum(),
    });
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, blockNum: syncSummary.blockNum() },
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
    const client = await webClient(networkId, serializedMockChain);
    const faucet = await clientNewFaucet(client, {
      storageMode,
      nonFungible: false,
      tokenSymbol,
      decimals,
      maxSupply,
    });
    const syncSummary = await client.syncState();
    const account = await wasmAccountToAccount({
      wasmAccount: faucet,
      name,
      networkId,
      updatedAt: syncSummary.blockNum(),
    });
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const importAccountByAddress = async ({
    name,
    address,
  }: {
    name: string;
    address: string;
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const wasmAccount = await clientGetAccountByAddress(client, address);
    const syncSummary = await client.syncState();
    const consumableNotes = await clientGetConsumableNotes(
      client,
      wasmAccount.id().toString()
    );
    const account = await wasmAccountToAccount({
      wasmAccount,
      name,
      networkId,
      updatedAt: syncSummary.blockNum(),
      consumableNoteIds: consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      ),
    });
    if (account.code === FUNGIBLE_FAUCET_CODE) {
      // faucets
      account.components = ["basic-fungible-faucet"];
    } else if (account.code === COUNTER_CONTRACT_CODE) {
      // Counter Contract
      account.components = ["no-auth", "counter-contract"];
    } /* else if (account.address === "mtst1qqtzp4x9c9gv6yp7qm8uzzr7y3cqqua4clw") {
      account.components = ["no-auth", "counter-map-contract"];
    }*/ else if (account.code === BASIC_WALLET_CODE) {
      // Basic Wallet
      account.components = ["basic-auth", "basic-wallet"];
    }
    const inputNotes = await Promise.all(
      consumableNotes.map((consumableNote) =>
        wasmInputNoteToInputNote(consumableNote.inputNoteRecord())
      )
    );
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: { account, inputNotes, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const importConnectedWallet = async () => {
    const connectedWallet = wallets.find(
      ({ address }) => address === connectedWalletAddress
    );
    if (!connectedWalletAddress || connectedWallet || networkId !== "mtst") {
      return;
    }
    const client = await webClient(networkId, serializedMockChain);
    try {
      await clientGetAccountByAddress(client, connectedWalletAddress);
      await importAccountByAddress({
        name: "Miden Account 1",
        address: connectedWalletAddress,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      await clientImportNewWallet(client, connectedWalletAddress);
      await importAccountByAddress({
        name: "Miden Account 1",
        address: connectedWalletAddress,
      });
    }
  };
  const deployAccount = async ({
    name,
    accountType,
    storageMode,
    components,
  }: {
    name: string;
    accountType: AccountType;
    storageMode: AccountStorageMode;
    components: Component[];
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const componentScriptIds = components.map(({ scriptId }) => scriptId);
    const componentScripts = scripts.filter(({ id }) =>
      componentScriptIds.includes(id)
    );
    // TODO remove mock
    if (tutorialId === "deploy-a-counter-contract") {
      const accountComponent = components.find(
        ({ type }) => type === "account"
      )!;
      const script = componentScripts.find(
        ({ id }) => id === accountComponent.scriptId
      )!;
      const matches = script.rust.matchAll(/felt!\((\d*)\)/g);
      const lastMatch = Array.from(matches ?? []).at(-1);
      const incrementValue = Number(lastMatch?.at(1));
      // const index = componentScripts.findIndex(({ id }) => id === script.id);
      // componentScripts[index] = {
      //   ...script,
      //   masm: counterMapContractMasm.replace("add.1", `add.${incrementValue}`),
      // };
      script.masm = counterMapContractMasm.replace(
        "add.1",
        `add.${incrementValue}`
      );
    }
    //
    const wasmAccount = await clientDeployAccount(client, {
      accountType,
      storageMode,
      components,
      scripts: componentScripts,
    });
    const syncSummary = await client.syncState();
    const account = await wasmAccountToAccount({
      wasmAccount,
      name,
      components: components.map(({ id }) => id),
      networkId,
      updatedAt: syncSummary.blockNum(),
    });
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
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
  return {
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    deployAccountDialogOpen,
    accounts,
    wallets,
    faucets,
    newWallet,
    newFaucet,
    importAccountByAddress,
    importConnectedWallet,
    deployAccount,
    openCreateWalletDialog,
    closeCreateWalletDialog,
    openCreateFaucetDialog,
    closeCreateFaucetDialog,
    openImportAccountDialog,
    closeImportAccountDialog,
    openDeployAccountDialog,
    closeDeployAccountDialog,
  };
};

export default useAccounts;
