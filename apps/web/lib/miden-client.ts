import { MidenClient, WasmWebClient } from "@miden-sdk/miden-sdk";
import { WalletAdapterNetwork } from "@miden-sdk/miden-wallet-adapter";
import {
  DEVNET_NOTE_TRANSPORT_URL,
  DEVNET_RPC_URL,
  LOCAL_RPC_URL,
  MAINNET_NOTE_TRANSPORT_URL,
  MAINNET_PROVER_URL,
  MAINNET_RPC_URL,
  TESTNET_NOTE_TRANSPORT_URL,
  TESTNET_RPC_URL,
} from "@/lib/constants";
import type { NetworkId } from "@/lib/types/network";

// "auto" picks the classic worker on Safari/WebKit, which can't find the WASM
// in our Vite build: it resolves `assets/miden_client_web.wasm` against its
// own URL (/assets/assets/…, unhashed) and gets the SPA's HTML. "module" works
// in Safari too.
// `workerMode` is missing from the SDK's types.
(WasmWebClient as unknown as { workerMode: string }).workerMode = "module";

// The SDK has shorthands for testnet and devnet only: mainnet takes full URLs.
export const networks = {
  mm: MAINNET_RPC_URL,
  mtst: "testnet",
  mdev: "devnet",
  mlcl: "local",
  mmck: "local",
} as const;

export const provers = {
  mm: MAINNET_PROVER_URL,
  mtst: "testnet",
  mdev: "devnet",
  mlcl: "local",
  mmck: "local",
} as const;

export const rpcUrls = {
  mm: MAINNET_RPC_URL,
  mtst: TESTNET_RPC_URL,
  mdev: DEVNET_RPC_URL,
  mlcl: LOCAL_RPC_URL,
  mmck: LOCAL_RPC_URL,
} as const;

export const noteTransportUrls = {
  mm: MAINNET_NOTE_TRANSPORT_URL,
  mtst: TESTNET_NOTE_TRANSPORT_URL,
  mdev: DEVNET_NOTE_TRANSPORT_URL,
  mlcl: undefined,
  mmck: undefined,
} as const;

// The network Bread Wallet connects to. The adapter's enum has no mainnet yet,
// but the extension's network ids include it.
export const walletAdapterNetworks = {
  mm: "mainnet" as WalletAdapterNetwork,
  mtst: WalletAdapterNetwork.Testnet,
  mdev: WalletAdapterNetwork.Devnet,
  mlcl: WalletAdapterNetwork.Localnet,
  mmck: WalletAdapterNetwork.Localnet,
} as const;

const createMidenClient = (networkId: NetworkId) =>
  MidenClient.create({
    rpcUrl: networks[networkId],
    noteTransportUrl: noteTransportUrls[networkId],
    proverUrl: provers[networkId],
  });

export default createMidenClient;
