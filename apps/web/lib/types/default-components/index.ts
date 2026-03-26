import authEcdsaK256Keccak from "@/lib/types/default-components/auth-ecdsa-k256-keccak";
import authFalcon512Rpo from "@/lib/types/default-components/auth-falcon-512-rpo";
import authMultisigGuardian from "@/lib/types/default-components/auth-multisig-guardian";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import basicFungibleFaucet from "@/lib/types/default-components/basic-fungible-faucet";
import basicWallet from "@/lib/types/default-components/basic-wallet";
import counterContract from "@/lib/types/default-components/counter-contract";

const defaultComponents = [
  authEcdsaK256Keccak,
  authFalcon512Rpo,
  authMultisigGuardian,
  authNoAuth,
  basicFungibleFaucet,
  basicWallet,
  counterContract,
];

export const defaultComponentIds = defaultComponents.map(({ id }) => id);

export default defaultComponents;
