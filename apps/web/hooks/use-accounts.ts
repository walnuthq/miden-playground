import { partition } from "lodash";
import {
  AccountId,
  AccountStorageMode,
  NoteFilterTypes,
  AccountType,
} from "@workspace/mock-web-client";
import {
  getAccountById,
  getConsumableNotes,
  webClient,
} from "@/lib/web-client";
import useGlobalContext from "@/components/global-context/hook";
import {
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
  type Component,
  type StorageSlot,
} from "@/lib/types";
import useScripts from "@/hooks/use-scripts";

const wasmStorageSlotFromStorageSlot = async (storageSlot: StorageSlot) => {
  const { StorageSlot, Felt, RpoDigest, StorageMap, Word } = await import(
    "@demox-labs/miden-sdk"
  );
  const bigintToWord = (value: bigint) =>
    Word.newFromU64s(
      BigUint64Array.from(
        BigInt(value)
          .toString(16)
          .padStart(64, "0")
          .match(/.{1,16}/g)!
          .map((chunk) => BigInt(`0x${chunk}`))
      )
    );
  const bigintToRpoDigest = (value: bigint) =>
    new RpoDigest(
      BigInt(value)
        .toString(16)
        .padStart(64, "0")
        .match(/.{1,16}/g)!
        .map((chunk) => new Felt(BigInt(`0x${chunk}`)))
    );
  if (storageSlot.type === "value") {
    return StorageSlot.fromValue(bigintToWord(BigInt(storageSlot.value)));
  } else {
    const storageMap = new StorageMap();
    const keyValuePairs = storageSlot.value
      .trim()
      .split(",")
      .map((keyValuePair) => keyValuePair.trim());
    for (const keyValuePair of keyValuePairs) {
      const [key, value] = keyValuePair.split(":");
      storageMap.insert(
        bigintToRpoDigest(BigInt(key!)),
        bigintToWord(BigInt(value!))
      );
    }
    return StorageSlot.map(storageMap);
  }
};

const useAccounts = () => {
  const {
    networkId,
    createWalletDialogOpen,
    createFaucetDialogOpen,
    importAccountDialogOpen,
    deployAccountDialogOpen,
    accounts,
    dispatch,
  } = useGlobalContext();
  const { scripts } = useScripts();
  const [faucets, wallets] = partition(accounts, (account) => account.isFaucet);
  const newWallet = async ({
    name,
    storageMode,
  }: {
    name: string;
    storageMode: AccountStorageMode;
  }) => {
    const client = await webClient(networkId);
    const wallet = await client.newWallet(storageMode, true);
    const syncSummary = await client.syncState();
    const account = wasmAccountToAccount(
      wallet,
      name,
      networkId,
      syncSummary.blockNum()
    );
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
    const client = await webClient(networkId);
    const faucet = await client.newFaucet(
      storageMode,
      false,
      tokenSymbol,
      decimals,
      maxSupply
    );
    const syncSummary = await client.syncState();
    const account = wasmAccountToAccount(
      faucet,
      name,
      networkId,
      syncSummary.blockNum(),
      [],
      tokenSymbol
    );
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
    const client = await webClient(networkId);
    const wasmAccount = await getAccountById(client, address);
    wasmAccount.id = () => AccountId.fromBech32(address);
    const syncSummary = await client.syncState();
    const consumableNotes = await getConsumableNotes(client, address);
    const account = wasmAccountToAccount(
      wasmAccount,
      name,
      networkId,
      syncSummary.blockNum(),
      consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      )
    );
    if (address === "mtst1qppen8yngje35gr223jwe6ptjy7gedn9") {
      // MDN Faucet
      account.components = [];
    } else if (address === "mtst1qz43ftxkrzcjsqz3hpw332qwny2ggsp0") {
      // Counter Contract
      account.components = ["no-auth", "counter-contract"];
    } else {
      // Basic Wallet
      account.components = ["basic-auth", "basic-wallet"];
    }
    const inputNotes = consumableNotes.map((consumableNote) =>
      wasmInputNoteToInputNote(consumableNote.inputNoteRecord(), networkId)
    );
    dispatch({
      type: "IMPORT_ACCOUNT",
      payload: { account, inputNotes, blockNum: syncSummary.blockNum() },
    });
    return account;
  };
  const importConnectedWallet = async (accountId: string) => {
    const client = await webClient(networkId);
    try {
      await getAccountById(client, accountId);
      return importAccountByAddress({
        name: "Miden Account 1",
        address: accountId,
      });
    } catch (error) {
      const wallet = await client.newWallet(AccountStorageMode.public(), true);
      const serializedWallet = wallet.serialize();
      const fromHexString = (hexString: string) => {
        const chunks = hexString.match(/.{1,2}/g)!;
        return Uint8Array.from(chunks.map((byte) => Number.parseInt(byte, 16)));
      };
      const serializedImportedWallet = Uint8Array.from([
        ...fromHexString(AccountId.fromBech32(accountId).toString().slice(2)),
        ...serializedWallet.slice(15),
      ]);
      const { Account: WasmAccount, Word } = await import(
        "@demox-labs/miden-sdk"
      );
      await client.newAccount(
        // @ts-ignore
        WasmAccount.deserialize(serializedImportedWallet),
        Word.newFromU64s(BigUint64Array.from([0n, 0n, 0n, 0n])),
        true
      );
      return importAccountByAddress({
        name: "Miden Account 1",
        address: accountId,
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
    const client = await webClient(networkId);
    const {
      TransactionKernel,
      AccountBuilder,
      AccountComponent,
      StorageSlot,
      AccountStorageMode: WasmAccountStorageMode,
    } = await import("@demox-labs/miden-sdk");
    const assembler = TransactionKernel.assembler();
    const initSeed = new Uint8Array(32);
    crypto.getRandomValues(initSeed);
    let accountBuilder = new AccountBuilder(initSeed)
      .accountType(accountType)
      .storageMode(
        storageMode.asStr() === "public"
          ? WasmAccountStorageMode.public()
          : WasmAccountStorageMode.private()
      );
    for (const component of components) {
      const script = scripts.find(({ id }) => id === component.scriptId);
      if (!script) {
        continue;
      }
      const storageSlots = await Promise.all(
        component.storageSlots.map(wasmStorageSlotFromStorageSlot)
      );
      const compiledComponent = AccountComponent.compile(
        script.masm,
        assembler,
        storageSlots
      ).withSupportsAllTypes();
      if (component.type === "auth") {
        accountBuilder = accountBuilder.withAuthComponent(compiledComponent);
      } else {
        accountBuilder = accountBuilder.withComponent(compiledComponent);
      }
    }
    const { account: wasmAccount, seed } = accountBuilder.build();
    // @ts-ignore
    await client.newAccount(wasmAccount, seed, true);
    const syncSummary = await client.syncState();
    const address = wasmAccount.id().toBech32();
    // @ts-ignore
    wasmAccount.id = () => AccountId.fromBech32(address);
    const account = wasmAccountToAccount(
      // @ts-ignore
      wasmAccount,
      name,
      networkId,
      syncSummary.blockNum()
    );
    account.components = components.map(({ id }) => id);
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
