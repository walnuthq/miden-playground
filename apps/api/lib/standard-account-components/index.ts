import type { Package } from "@/lib/types";
import basicWallet from "@/lib/standard-account-components/basic-wallet";
import fungibleFaucet from "@/lib/standard-account-components/fungible-faucet";
import authority from "@/lib/standard-account-components/authority";
import ownable2Step from "@/lib/standard-account-components/ownable2step";
import roleBasedAccessControl from "@/lib/standard-account-components/role-based-access-control";
import authSingleSig from "@/lib/standard-account-components/auth-single-sig";
import authSingleSigAcl from "@/lib/standard-account-components/auth-single-sig-acl";
import authMultisig from "@/lib/standard-account-components/auth-multisig";
import authMultisigSmart from "@/lib/standard-account-components/auth-multisig-smart";
import authGuardedMultisig from "@/lib/standard-account-components/auth-guarded-multisig";
import authNoAuth from "@/lib/standard-account-components/auth-no-auth";
import authNetworkAccount from "@/lib/standard-account-components/auth-network-account";

export const getStandardAccountComponent = (
  accountComponent: string,
): Package | null => {
  switch (accountComponent) {
    case "BasicWallet": {
      return basicWallet;
    }
    case "FungibleFaucet": {
      return fungibleFaucet;
    }
    case "Authority": {
      return authority;
    }
    case "Ownable2Step": {
      return ownable2Step;
    }
    case "RoleBasedAccessControl": {
      return roleBasedAccessControl;
    }
    case "AuthSingleSig": {
      return authSingleSig;
    }
    case "AuthSingleSigAcl": {
      return authSingleSigAcl;
    }
    case "AuthMultisig": {
      return authMultisig;
    }
    case "AuthMultisigSmart": {
      return authMultisigSmart;
    }
    case "AuthGuardedMultisig": {
      return authGuardedMultisig;
    }
    case "AuthNoAuth": {
      return authNoAuth;
    }
    case "AuthNetworkAccount": {
      return authNetworkAccount;
    }
    default: {
      return null;
    }
  }
};
