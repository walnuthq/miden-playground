import { type WebClient as WebClientType } from "@miden-sdk/miden-sdk";
import {
  MultisigClient,
  type SignatureScheme,
} from "@openzeppelin/miden-multisig-client";

export const initMultisigClient = async ({
  webClient,
  guardianEndpoint,
  scheme,
}: {
  webClient: WebClientType;
  guardianEndpoint: string;
  scheme?: SignatureScheme;
}) => {
  const client = new MultisigClient(webClient, { guardianEndpoint });
  const { commitment: guardianCommitment, pubkey: guardianPublicKey } =
    await client.guardianClient.getPubkey(scheme);
  return { client, guardianCommitment, guardianPublicKey };
};
