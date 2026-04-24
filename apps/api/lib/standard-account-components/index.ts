import type { Package } from "@/lib/types";
import basicWallet from "@/lib/standard-account-components/basic-wallet";
import basicFungibleFaucet from "@/lib/standard-account-components/basic-fungible-faucet";
import networkFungibleFaucet from "@/lib/standard-account-components/network-fungible-faucet";
import authSingleSig from "@/lib/standard-account-components/auth-single-sig";
import authSingleSigAcl from "@/lib/standard-account-components/auth-single-sig-acl";
import authMultisig from "@/lib/standard-account-components/auth-multisig";
import authMultisigPsm from "@/lib/standard-account-components/auth-multisig-psm";
import authNoAuth from "@/lib/standard-account-components/auth-no-auth";

export const getStandardAccountComponent = (
  accountComponent: string,
): Package | null => {
  switch (accountComponent) {
    case "BasicWallet": {
      return basicWallet;
    }
    case "BasicFungibleFaucet": {
      return basicFungibleFaucet;
    }
    case "NetworkFungibleFaucet": {
      return networkFungibleFaucet;
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
    case "AuthMultisigPsm": {
      return authMultisigPsm;
    }
    case "AuthNoAuth": {
      return authNoAuth;
    }
    default: {
      return null;
    }
  }
};
