import { useWallet } from "@demox-labs/miden-wallet-adapter";
import {
  clientGetAccountById,
  clientGetAccountByAddress,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
  clientNewWallet,
  clientNewFaucet,
  clientDeployAccount,
} from "@/lib/web-client";
import { type Account as WasmAccountType } from "@demox-labs/miden-sdk";
import useGlobalContext from "@/components/global-context/hook";
import {
  type AccountStorageMode,
  type AccountType,
  type Account,
  basicWalletAccount,
  // midenFaucetAccount,
} from "@/lib/types/account";
import { type Component } from "@/lib/types/component";
import useScripts from "@/hooks/use-scripts";
import useComponents from "@/hooks/use-components";
import {
  // MIDEN_FAUCET_ADDRESS,
  BASIC_WALLET_CODE,
  COUNTER_CONTRACT_ADDRESS,
} from "@/lib/constants";
import { counterMapContractMasm } from "@/lib/types/default-scripts/counter-map-contract";
import { sleep } from "@/lib/utils";
import useWebClient from "@/hooks/use-web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";

const useAccounts = () => {
  const { address: connectedWalletAddress } = useWallet();
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
  const { components } = useComponents();
  const wallets = accounts.filter(
    (account) => account.code === BASIC_WALLET_CODE
  );
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
  }: {
    name: string;
    address: string;
  }) => {
    // TODO mock importing Miden Faucet
    // if (address === MIDEN_FAUCET_ADDRESS) {
    //   const account = midenFaucetAccount();
    //   dispatch({
    //     type: "IMPORT_ACCOUNT",
    //     payload: { account, inputNotes: [], blockNum },
    //   });
    //   return account;
    // }
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
      if (address === connectedWalletAddress) {
        const account = {
          ...basicWalletAccount({ storageMode: "public" }),
          id: midenSdk.Address.fromBech32(address).accountId().toString(),
          name,
          address,
          isNew: true,
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
        consumableNote.inputNoteRecord().id().toString()
      ),
      // scripts,
      midenSdk,
    });
    if (
      address === COUNTER_CONTRACT_ADDRESS &&
      tutorialId === "interact-with-the-counter-contract"
    ) {
      account.components = ["no-auth", "counter-value-contract"];
    }
    const inputNotes = consumableNotes.map((consumableNote) =>
      wasmInputNoteToInputNote({
        record: consumableNote.inputNoteRecord(),
        midenSdk,
      })
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
    dispatch({ type: "SUBMITTING_TRANSACTION" });
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
    const wasmAccount = await clientDeployAccount({
      client,
      accountType,
      storageMode,
      components,
      scripts: componentScripts,
      midenSdk,
    });
    const account = wasmAccountToAccount({
      wasmAccount,
      name,
      components: components.map(({ id }) => id),
      networkId,
      updatedAt: syncSummary.blockNum(),
      midenSdk,
    });
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
  const verifyAccountComponent = async ({
    accountId,
    componentId,
  }: {
    accountId: string;
    componentId: string;
  }) => {
    const { AccountComponent, Package, MidenArrays } = midenSdk;
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
    const script = scripts.find(({ id }) => id === component.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }
    const accountComponent = AccountComponent.fromPackage(
      Package.deserialize(new Uint8Array(script.packageBytes)),
      new MidenArrays.StorageSlotArray([])
    );
    const wasmAccount = await clientGetAccountById({
      client,
      accountId: account.id,
      midenSdk,
    });
    const code = wasmAccount.code();
    const verified = accountComponent
      .getProcedures()
      .every((procedure) => code.hasProcedure(procedure.digest));
    await sleep(400);
    if (verified) {
      dispatch({
        type: "VERIFY_ACCOUNT_COMPONENT",
        payload: { accountId, componentId },
      });
    }
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
    verifyAccountComponent,
  };
};

export default useAccounts;
