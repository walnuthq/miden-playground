import { MidenClient } from "@miden-sdk/miden-sdk";
import {
  TESTNET_NOTE_TRANSPORT_URL,
  DEVNET_NOTE_TRANSPORT_URL,
} from "@/lib/constants";
import type { NetworkId } from "@/lib/types/network";

export const networks = {
  mtst: "testnet",
  mdev: "devnet",
  mlcl: "local",
  mmck: "local",
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
