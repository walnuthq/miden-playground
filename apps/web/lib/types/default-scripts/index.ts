import authGuardedMultisig from "@/lib/types/default-scripts/auth-guarded-multisig";
import authNetworkAccount from "@/lib/types/default-scripts/auth-network-account";
import authNoAuth from "@/lib/types/default-scripts/auth-no-auth";
import authSingleSig from "@/lib/types/default-scripts/auth-single-sig";
import basicWallet from "@/lib/types/default-scripts/basic-wallet";
import core from "@/lib/types/default-scripts/core";
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
  feeSponsorship,
  fungibleFaucet,
  p2id,
  protocol,
  txFee,
];

// The MASM counter was a built-in until every tutorial compiled real packages.
// A state persisted before then still holds its copy, whose id keeps counting
// as a built-in's: the copy stays out of the user's scripts, and isn't taken
// for the script a tutorial has them create.
const retiredScriptIds = ["counter-contract"];

export const defaultScriptIds = [
  ...defaultScripts.map(({ id }) => id),
  ...retiredScriptIds,
];

export default defaultScripts;
