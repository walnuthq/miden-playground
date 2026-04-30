import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import {
  basicWalletAccount,
  basicFungibleFaucetAccount,
} from "@/lib/utils/account";

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
      id: "0x8277577e006edd2044318e0cf6f030",
      name: "MDN Faucet",
      address: "mtst1azp8w4m7qphd6gzyxx8qeahsxqmcwrav_qr7qqq9wr6w",
      identifier: "mtst1azp8w4m7qphd6gzyxx8qeahsxqmcwrav",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      storage: [
        {
          name: "miden::standards::fungible_faucets::metadata",
          type: "value",
          item: "0x00008a5d7845630100008a5d7845630106000000000000002141030000000000",
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
          item: "0xc84756af239380d6cf721127fd524230f4fde49bbf3963a8e3848870ccdefdee",
          mapEntries: [],
        },
      ],
    },
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: "0xc326d9b7a70359104cb45fb1968c5c",
      name: "Wallet A",
      address: "mtst1arpjdkdh5up4jyzvk30mr95vtszruza6_qr7qqq9wr6w",
      identifier: "mtst1arpjdkdh5up4jyzvk30mr95vtszruza6",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      fungibleAssets: [
        {
          faucetId: "0x8277577e006edd2044318e0cf6f030",
          amount: "100000000000000000",
        },
      ],
      storage: [
        {
          name: "miden::standards::auth::singlesig::scheme",
          type: "value",
          item: "0x0200000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::auth::singlesig::pub_key",
          type: "value",
          item: "0x5eb9f4e047551eda3f3c0a2d8e1fafa7ceee12cbaa07a7d4b0023cdbdaa08956",
          mapEntries: [],
        },
      ],
    },
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: "0x0c6f65037e4c121050a9b14d325bb8",
      name: "Wallet B",
      address: "mtst1aqxx7egr0expyyzs4xc56vjmhqsmcqlt_qr7qqq9wr6w",
      identifier: "mtst1aqxx7egr0expyyzs4xc56vjmhqsmcqlt",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      storage: [
        {
          name: "miden::standards::auth::singlesig::scheme",
          type: "value",
          item: "0x0200000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::auth::singlesig::pub_key",
          type: "value",
          item: "0xe71fc75aa42a0f4268947b79122b7750fd263d9a318714f9c7e9cc98131e3c91",
          mapEntries: [],
        },
      ],
    },
  ],
  tutorialId: "transfer-assets-between-wallets",
};

export default state;
