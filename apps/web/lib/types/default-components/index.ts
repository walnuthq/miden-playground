import authSingleSig from "@/lib/types/default-components/auth-single-sig";
import authMultisigGuardian from "@/lib/types/default-components/auth-multisig-guardian";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import basicFungibleFaucet from "@/lib/types/default-components/basic-fungible-faucet";
import basicWallet from "@/lib/types/default-components/basic-wallet";
import counterContract from "@/lib/types/default-components/counter-contract";

const defaultComponents = [
  authSingleSig,
  authMultisigGuardian,
  authNoAuth,
  basicFungibleFaucet,
  basicWallet,
  counterContract,
];

export const defaultComponentIds = defaultComponents.map(({ id }) => id);

export default defaultComponents;
