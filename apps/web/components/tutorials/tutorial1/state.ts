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
      id: "0xff917bfe09b602200c70547535fc37",
      name: "MDN Faucet",
      address: "mlcl1qrlez7l7pxmqygqvwp282d0uxacqqel3pc6",
      storage: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x4c55e4698db580304ee0fd414da05ec834c498dac6353f5ca7b7a62baeb43234",
        "0x00008a5d78456301060000000000000021410300000000000000000000000000",
      ],
    },
  ],
  tutorialId: "create-and-fund-wallet",
};

export default state;
