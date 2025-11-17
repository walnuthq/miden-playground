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
import { type Account as WasmAccount } from "@demox-labs/miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import { type AccountStorageMode, type AccountType } from "@/lib/types/account";
import { type Component } from "@/lib/types/component";
import useScripts from "@/hooks/use-scripts";
import useComponents from "@/hooks/use-components";
import {
  BASIC_WALLET_CODE,
  COUNTER_CONTRACT_CODE,
  FUNGIBLE_FAUCET_CODE,
} from "@/lib/constants";
import { counterMapContractMasm } from "@/lib/types/default-scripts/counter-map-contract";
import { sleep } from "@/lib/utils";

const useAccounts = () => {
  const {
    networkId,
    serializedMockChain,
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
  const { accountId: connectedWalletAddress } = useWallet();
  const { scripts } = useScripts();
  const { components } = useComponents();
  const wallets = accounts.filter((account) => account.isWallet);
  const faucets = accounts.filter((account) => account.isFaucet);
  const connectedWallet = wallets.find(
    ({ address }) => address === connectedWalletAddress
  );
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
    const account = await wasmAccountToAccount({
      wasmAccount: wallet,
      name,
      networkId,
      updatedAt: blockNum,
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
    const client = await webClient(networkId, serializedMockChain);
    const faucet = await clientNewFaucet(client, {
      storageMode,
      nonFungible: false,
      tokenSymbol,
      decimals,
      maxSupply,
    });
    const account = await wasmAccountToAccount({
      wasmAccount: faucet,
      name,
      networkId,
      updatedAt: blockNum,
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
  }: {
    name: string;
    address: string;
  }) => {
    const client = await webClient(networkId, serializedMockChain);
    const syncSummary = await client.syncState();
    let wasmAccount: WasmAccount | null = null;
    try {
      wasmAccount = await clientGetAccountByAddress(client, address);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      await clientImportNewWallet(client, address);
      wasmAccount = await clientGetAccountByAddress(client, address);
    }
    if (!wasmAccount) {
      throw new Error("Account not found");
    }
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
      account.components = ["no-auth"];
      if (
        [
          "interact-with-the-counter-contract",
          "foreign-procedure-invocation",
        ].includes(tutorialId)
      ) {
        account.components.push("counter-contract");
      }
    } else if (account.code === BASIC_WALLET_CODE) {
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
    if (networkId !== "mtst" || !connectedWalletAddress || connectedWallet) {
      return;
    }
    await importAccountByAddress({
      name: "Miden Account 1",
      address: connectedWalletAddress,
    });
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
    const syncSummary = await client.syncState();
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
    const account = await wasmAccountToAccount({
      wasmAccount,
      name,
      components: components.map(({ id }) => id),
      networkId,
      updatedAt: syncSummary.blockNum(),
    });
    dispatch({
      type: "NEW_ACCOUNT",
      payload: { account },
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
  const openVerifyAccountComponentDialog = (accountId: string) =>
    dispatch({
      type: "OPEN_VERIFY_ACCOUNT_COMPONENT_DIALOG",
      payload: { accountId },
    });
  const closeVerifyAccountComponentDialog = () =>
    dispatch({
      type: "CLOSE_VERIFY_ACCOUNT_COMPONENT_DIALOG",
    });
  const verifyAccountComponent = async ({
    accountId,
    componentId,
  }: {
    accountId: string;
    componentId: string;
  }) => {
    const account = accounts.find(({ id }) => id === accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (account.components.includes(componentId)) {
      // already verified
      return false;
    }
    const component = components.find(({ id }) => id === componentId);
    if (!component) {
      throw new Error("Component not found");
    }
    // TODO mocked atm, check if account component code is included in AccountCode using procedure
    // digests and AccountCode::has_procedure
    const verified = true;
    await sleep(400);
    dispatch({
      type: "VERIFY_ACCOUNT_COMPONENT",
      payload: { accountId, componentId },
    });
    return verified;
  };
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
    verifyAccountComponent,
  };
};

export default useAccounts;
