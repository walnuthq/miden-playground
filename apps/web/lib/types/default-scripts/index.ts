import authGuardedMultisig from "@/lib/types/default-scripts/auth-guarded-multisig";
import authNetworkAccount from "@/lib/types/default-scripts/auth-network-account";
import authNoAuth from "@/lib/types/default-scripts/auth-no-auth";
import authSingleSig from "@/lib/types/default-scripts/auth-single-sig";
import basicWallet from "@/lib/types/default-scripts/basic-wallet";
import core from "@/lib/types/default-scripts/core";
import counterContract from "@/lib/types/default-scripts/counter-contract";
import feeSponsorship from "@/lib/types/default-scripts/fee-sponsorship";
import fungibleFaucet from "@/lib/types/default-scripts/fungible-faucet";
import p2id from "@/lib/types/default-scripts/p2id";
import protocol from "@/lib/types/default-scripts/protocol";
import txFee from "@/lib/types/default-scripts/tx-fee";

const defaultScripts = [
  authGuardedMultisig,
  authNetworkAccount,
  authNoAuth,
  authSingleSig,
  core,
  basicWallet,
  counterContract,
  feeSponsorship,
  fungibleFaucet,
  p2id,
  protocol,
  txFee,
];

export const defaultScriptIds = defaultScripts.map(({ id }) => id);

export default defaultScripts;
