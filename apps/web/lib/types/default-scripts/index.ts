import std from "@/lib/types/default-scripts/std";
import base from "@/lib/types/default-scripts/base";
import noAuth from "@/lib/types/default-scripts/no-auth";
import rpoFalcon512Auth from "@/lib/types/default-scripts/rpo-falcon-512-auth";
import ecdsaK256KeccakAuth from "@/lib/types/default-scripts/ecdsa-k256-keccak-auth";
import p2id from "@/lib/types/default-scripts/p2id";
// import p2ide from "@/lib/types/default-scripts/p2ide";
import basicFungibleFaucet from "@/lib/types/default-scripts/basic-fungible-faucet";
import basicWallet from "@/lib/types/default-scripts/basic-wallet";
import counterContract from "@/lib/types/default-scripts/counter-contract";

const defaultScripts = [
  std,
  base,
  noAuth,
  rpoFalcon512Auth,
  ecdsaK256KeccakAuth,
  p2id,
  // p2ide,
  basicFungibleFaucet,
  basicWallet,
  counterContract,
];

export const defaultScriptIds = defaultScripts.map(({ id }) => id);

export default defaultScripts;
