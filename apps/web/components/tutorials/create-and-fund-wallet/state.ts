import { basicFungibleFaucetAccount } from "@/lib/utils/account";
import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";

const state: State = {
  ...defaultState(),
  accounts: [
    {
      ...basicFungibleFaucetAccount({
        storageMode: "public",
        symbol: "MDN",
        decimals: 6,
        maxSupply: "100000000000000000",
        totalSupply: "0",
      }),
      id: "0x4f8c7e5870e79520025c8693649ddf",
      name: "MDN Faucet",
      address: "mtst1ap8ccljcwrne2gqztjrfxeyamuzpdvw9_qr7qqq9wr6w",
      identifier: "mtst1ap8ccljcwrne2gqztjrfxeyamuzpdvw9",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      storage: [
        {
          name: "miden::standards::fungible_faucets::metadata",
          type: "value",
          item: "0x000000000000000000008a5d7845630106000000000000002141030000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::mint_policy_manager::allowed_policy_proc_roots",
          type: "map",
          item: "0x5ec52927ccafaa5d8023e7049cec6bebf981d451a33dd07de3d437cc831b575c",
          mapEntries: [
            {
              key: "0xbc05c4459b303d098f0d1dcafa41ec505e0022cf6c8dbc651672035d533b70b7",
              value:
                "0x0100000000000000000000000000000000000000000000000000000000000000",
            },
          ],
        },
        {
          name: "miden::standards::auth::singlesig::scheme",
          type: "value",
          item: "0x0200000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::mint_policy_manager::active_policy_proc_root",
          type: "value",
          item: "0xbc05c4459b303d098f0d1dcafa41ec505e0022cf6c8dbc651672035d533b70b7",
          mapEntries: [],
        },
        {
          name: "miden::standards::mint_policy_manager::policy_authority",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::auth::singlesig::pub_key",
          type: "value",
          item: "0x50edd20821d345803f111816c7eb747e3ad0835c8c0d19ea629c7506ef9cf64d",
          mapEntries: [],
        },
      ],
    },
  ],
  tutorialId: "create-and-fund-wallet",
};

export default state;
