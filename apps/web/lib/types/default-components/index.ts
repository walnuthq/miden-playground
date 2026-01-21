import noAuth from "@/lib/types/default-components/no-auth";
import rpoFalcon512Auth from "@/lib/types/default-components/rpo-falcon-512-auth";
import ecdsaK256KeccakAuth from "@/lib/types/default-components/ecdsa-k256-keccak-auth";
import basicFungibleFaucet from "@/lib/types/default-components/basic-fungible-faucet";
import basicWallet from "@/lib/types/default-components/basic-wallet";
import counterContract from "@/lib/types/default-components/counter-contract";

const defaultComponents = [
  noAuth,
  rpoFalcon512Auth,
  ecdsaK256KeccakAuth,
  basicFungibleFaucet,
  basicWallet,
  counterContract,
];

export const defaultComponentIds = defaultComponents.map(({ id }) => id);

export default defaultComponents;
