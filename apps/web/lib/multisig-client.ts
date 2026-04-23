import { type MidenClient as MidenClientType } from "@miden-sdk/miden-sdk";
import {
  MultisigClient,
  type SignatureScheme,
} from "@openzeppelin/miden-multisig-client";

export const initMultisigClient = async ({
  midenClient,
  guardianEndpoint,
  scheme,
}: {
  midenClient: MidenClientType;
  guardianEndpoint: string;
  scheme?: SignatureScheme;
}) => {
  const client = new MultisigClient(midenClient, { guardianEndpoint });
  const { commitment: guardianCommitment, pubkey: guardianPublicKey } =
    await client.guardianClient.getPubkey(scheme);
  return { client, guardianCommitment, guardianPublicKey };
};
