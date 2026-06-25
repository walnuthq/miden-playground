import authSingleSig from "@/lib/types/default-scripts/auth-single-sig";
import authMultisigGuardian from "@/lib/types/default-scripts/auth-multisig-guardian";
import authNoAuth from "@/lib/types/default-scripts/auth-no-auth";
import base from "@/lib/types/default-scripts/base";
import fungibleFaucet from "@/lib/types/default-scripts/fungible-faucet";
import basicWallet from "@/lib/types/default-scripts/basic-wallet";
import counterContract from "@/lib/types/default-scripts/counter-contract";
import p2id from "@/lib/types/default-scripts/p2id";
// import p2ide from "@/lib/types/default-scripts/p2ide";
import std from "@/lib/types/default-scripts/std";

const defaultScripts = [
  authSingleSig,
  authMultisigGuardian,
  authNoAuth,
  base,
  fungibleFaucet,
  basicWallet,
  counterContract,
  p2id,
  // p2ide,
  std,
];

export const defaultScriptIds = defaultScripts.map(({ id }) => id);

export default defaultScripts;
