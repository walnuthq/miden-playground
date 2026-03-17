import { type WebClient as WebClientType } from "@miden-sdk/miden-sdk";
import {
  MultisigClient,
  type SignatureScheme,
} from "@openzeppelin/miden-multisig-client";

export const initMultisigClient = async (
  webClient: WebClientType,
  psmEndpoint: string,
  scheme?: SignatureScheme,
) => {
  const client = new MultisigClient(webClient, { psmEndpoint });
  const { psmCommitment, psmPublicKey } = await client.initialize(scheme);
  return { client, psmCommitment, psmPubkey: psmPublicKey };
};
