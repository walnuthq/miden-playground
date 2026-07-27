import type { MidenClient as MidenClientType } from "@miden-sdk/miden-sdk/lazy";
import {
  MultisigClient,
  type SignatureScheme,
} from "@openzeppelin/miden-multisig-client";
import type { NetworkId } from "@/lib/types/network";
import { rpcUrls } from "@/lib/miden-client";

export const initMultisigClient = async ({
  midenClient,
  networkId,
  guardianEndpoint,
  scheme,
}: {
  midenClient: MidenClientType;
  networkId: NetworkId;
  guardianEndpoint: string;
  scheme?: SignatureScheme;
}) => {
  const client = new MultisigClient(midenClient, {
    midenRpcEndpoint: rpcUrls[networkId],
    guardianEndpoint,
  });
  const { commitment: guardianCommitment, pubkey: guardianPublicKey } =
    await client.guardianClient.getPubkey(scheme);
  return { client, guardianCommitment, guardianPublicKey };
};
