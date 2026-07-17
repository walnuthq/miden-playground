import authMultisigGuardian from "@/lib/types/default-components/auth-multisig-guardian";
import authNetworkAccount from "@/lib/types/default-components/auth-network-account";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import authSingleSig from "@/lib/types/default-components/auth-single-sig";
import basicWallet from "@/lib/types/default-components/basic-wallet";
import counterContract from "@/lib/types/default-components/counter-contract";
import fungibleFaucet from "@/lib/types/default-components/fungible-faucet";

const defaultComponents = [
  // authentication-component
  authNoAuth,
  authNetworkAccount,
  authSingleSig,
  authMultisigGuardian,
  // account-component
  basicWallet,
  counterContract,
  fungibleFaucet,
];

export const defaultComponentIds = defaultComponents.map(({ id }) => id);

export default defaultComponents;
