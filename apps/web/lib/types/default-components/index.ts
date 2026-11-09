import authGuardedMultisig from "@/lib/types/default-components/auth-guarded-multisig";
import authNetworkAccount from "@/lib/types/default-components/auth-network-account";
import authNoAuth from "@/lib/types/default-components/auth-no-auth";
import authSingleSig from "@/lib/types/default-components/auth-single-sig";
import basicWallet from "@/lib/types/default-components/basic-wallet";
import fungibleFaucet from "@/lib/types/default-components/fungible-faucet";

const defaultComponents = [
  // authentication-component
  authNoAuth,
  authNetworkAccount,
  authSingleSig,
  authGuardedMultisig,
  // account-component
  basicWallet,
  fungibleFaucet,
];

// The MASM counter's component, a built-in until every tutorial compiled real
// packages. A state persisted before then still holds its copy, whose id keeps
// counting as a built-in's (see retiredScriptIds in default-scripts).
const retiredComponentIds = ["counter-contract"];

export const defaultComponentIds = [
  ...defaultComponents.map(({ id }) => id),
  ...retiredComponentIds,
];

export default defaultComponents;
