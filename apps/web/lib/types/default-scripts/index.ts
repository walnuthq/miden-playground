import authMultisigGuardian from "@/lib/types/default-scripts/auth-multisig-guardian";
import authNetworkAccount from "@/lib/types/default-scripts/auth-network-account";
import authNoAuth from "@/lib/types/default-scripts/auth-no-auth";
import authSingleSig from "@/lib/types/default-scripts/auth-single-sig";
import core from "@/lib/types/default-scripts/core";
import basicWallet from "@/lib/types/default-scripts/basic-wallet";
import counterContract from "@/lib/types/default-scripts/counter-contract";
import fungibleFaucet from "@/lib/types/default-scripts/fungible-faucet";
import p2id from "@/lib/types/default-scripts/p2id";
// import p2ide from "@/lib/types/default-scripts/p2ide";
import protocol from "@/lib/types/default-scripts/protocol";

const defaultScripts = [
  authMultisigGuardian,
  authNetworkAccount,
  authNoAuth,
  authSingleSig,
  core,
  basicWallet,
  counterContract,
  fungibleFaucet,
  p2id,
  // p2ide,
  protocol,
];

export const defaultScriptIds = defaultScripts.map(({ id }) => id);

export default defaultScripts;
