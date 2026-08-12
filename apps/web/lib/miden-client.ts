import { MidenClient, WasmWebClient } from "@miden-sdk/miden-sdk/lazy";
import {
  TESTNET_NOTE_TRANSPORT_URL,
  DEVNET_NOTE_TRANSPORT_URL,
  TESTNET_RPC_URL,
  DEVNET_RPC_URL,
  LOCAL_RPC_URL,
} from "@/lib/constants";
import type { NetworkId } from "@/lib/types/network";

// The SDK ships two web worker variants and its default `"auto"` mode picks the
// classic-script one on any AppleWebKit user agent. That variant inlines the
// Cargo glue and locates the WASM with
// `new URL("assets/miden_client_web.wasm", self.location.href)` — a form webpack
// cannot rewrite, so at runtime it resolves against the worker chunk's own
// directory to /_next/static/chunks/assets/miden_client_web.wasm, which 404s
// into the HTML error page. wasm-bindgen only falls back from
// `instantiateStreaming` to `arrayBuffer` on an *ok* response, so it rethrows and
// Safari surfaces "Unexpected response MIME type. Expected 'application/wasm'".
// The module variant pulls the WASM through a webpack asset module, so its URL is
// rewritten to the emitted /_next/static/media/*.wasm. Webpack compiles it down
// to a classic script anyway (it strips `{ type: "module" }`), so pinning it here
// costs Safari none of the module-worker cold start `"auto"` is avoiding.
(WasmWebClient as unknown as { workerMode: string }).workerMode = "module";

export const networks = {
  mtst: "testnet",
  mdev: "devnet",
  mlcl: "local",
  mmck: "local",
} as const;

export const rpcUrls = {
  mtst: TESTNET_RPC_URL,
  mdev: DEVNET_RPC_URL,
  mlcl: LOCAL_RPC_URL,
  mmck: LOCAL_RPC_URL,
} as const;

export const noteTransportUrls = {
  mtst: TESTNET_NOTE_TRANSPORT_URL,
  mdev: DEVNET_NOTE_TRANSPORT_URL,
  mlcl: undefined,
  mmck: undefined,
} as const;

const createMidenClient = (networkId: NetworkId) =>
  MidenClient.create({
    rpcUrl: networks[networkId],
    noteTransportUrl: noteTransportUrls[networkId],
    proverUrl: networks[networkId],
  });

export default createMidenClient;
