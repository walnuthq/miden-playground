import noAuth from "@/lib/types/default-scripts/no-auth";
import basicAuth from "@/lib/types/default-scripts/basic-auth";
import p2id from "@/lib/types/default-scripts/p2id";
// import p2ide from "@/lib/types/default-scripts/p2ide";
import basicFungibleFaucet from "@/lib/types/default-scripts/basic-fungible-faucet";
import basicWallet from "@/lib/types/default-scripts/basic-wallet";

const defaultScripts = [
  noAuth,
  basicAuth,
  p2id,
  // p2ide,
  basicFungibleFaucet,
  basicWallet,
  // counterContractScript,
];

export default defaultScripts;
