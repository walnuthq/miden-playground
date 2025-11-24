import { basicFungibleFaucetAccount } from "@/lib/types/account";
import { defaultState, type State } from "@/lib/types/state";

const state: State = {
  ...defaultState(),
  networkId: "mlcl",
  accounts: [
    {
      ...basicFungibleFaucetAccount({
        storageMode: "public",
        symbol: "MDN",
        decimals: 6,
        maxSupply: "100000000000000000",
        totalSupply: "0",
      }),
      id: "0x2b2f81fc8487ff2076b164f5bbf4fc",
      name: "MDN Faucet",
      address: "mlcl1aq4jlq0usjrl7grkk9j0twl5ls7tzu6c_qruqqypuyph",
      storage: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0xc8abd167f24f95c61f35ab8c604e82fd6c9dfef2f2dd46f454ddb183fd893b2d",
        "0x00008a5d78456301060000000000000021410300000000000000000000000000",
      ],
    },
  ],
  tutorialId: "create-and-fund-wallet",
};

export default state;
