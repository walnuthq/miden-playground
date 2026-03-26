import { type Package } from "@/lib/types";
import basicWallet from "@/lib/default-account-components/basic-wallet";
import basicFungibleFaucet from "@/lib/default-account-components/basic-fungible-faucet";
import networkFungibleFaucet from "@/lib/default-account-components/network-fungible-faucet";
import authEcdsaK256Keccak from "@/lib/default-account-components/auth-ecdsa-k256-keccak";
import authEcdsaK256KeccakAcl from "@/lib/default-account-components/auth-ecdsa-k256-keccak-acl";
import authEcdsaK256KeccakMultisig from "@/lib/default-account-components/auth-ecdsa-k256-keccak-multisig";
import authFalcon512Rpo from "@/lib/default-account-components/auth-falcon-512-rpo";
import authFalcon512RpoAcl from "@/lib/default-account-components/auth-falcon-512-rpo-acl";
import authFalcon512RpoMultisig from "@/lib/default-account-components/auth-falcon-512-rpo-multisig";
import authNoAuth from "@/lib/default-account-components/auth-no-auth";

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
    case "AuthEcdsaK256Keccak": {
      return authEcdsaK256Keccak;
    }
    case "AuthEcdsaK256KeccakAcl": {
      return authEcdsaK256KeccakAcl;
    }
    case "AuthEcdsaK256KeccakMultisig": {
      return authEcdsaK256KeccakMultisig;
    }
    case "AuthFalcon512Rpo": {
      return authFalcon512Rpo;
    }
    case "AuthFalcon512RpoAcl": {
      return authFalcon512RpoAcl;
    }
    case "AuthFalcon512RpoMultisig": {
      return authFalcon512RpoMultisig;
    }
    case "AuthNoAuth": {
      return authNoAuth;
    }
    default: {
      return null;
    }
  }
};
