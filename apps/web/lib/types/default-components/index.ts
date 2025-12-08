import noAuth from "@/lib/types/default-components/no-auth";
import basicAuth from "@/lib/types/default-components/basic-auth";
import basicFungibleFaucet from "@/lib/types/default-components/basic-fungible-faucet";
import basicWallet from "@/lib/types/default-components/basic-wallet";
import counterContract from "@/lib/types/default-components/counter-contract";

const defaultComponents = [
  noAuth,
  basicAuth,
  basicFungibleFaucet,
  basicWallet,
  counterContract,
];

export const defaultComponentIds = defaultComponents.map(({ id }) => id);

export default defaultComponents;
