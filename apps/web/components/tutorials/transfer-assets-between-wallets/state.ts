import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import {
  basicWalletAccount,
  basicFungibleFaucetAccount,
  midenFaucetAccount,
} from "@/lib/utils/account";

const state: State = {
  ...defaultState(),
  accounts: [
    midenFaucetAccount("mtst"),
    {
      ...basicFungibleFaucetAccount({
        storageMode: "public",
        symbol: "MDN",
        decimals: 6,
        maxSupply: "100000000000000000",
        totalSupply: "100000000000000000",
      }),
      id: "0x2cf0bcc168cd15915a34789a754b3f",
      name: "MDN Faucet",
      address: "mtst1aqk0p0xpdrx3ty26x3uf5a2t8ug0x2rl_qr7qqq9wr6w",
      identifier: "mtst1aqk0p0xpdrx3ty26x3uf5a2t8ug0x2rl",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      storage: [
        {
          name: "miden::standards::faucets::token_description_4",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::active_receive_policy_proc_root",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::external_link_2",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::external_link_5",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_description_2",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::logo_uri_3",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_description_0",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::logo_uri_4",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::active_send_policy_proc_root",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::active_mint_policy_proc_root",
          type: "value",
          item: "0x7b9b7aa3e92412e3c8dd53c88bf462e6f2e04e3afbf4a04c4742e131afa1a034",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_name_1",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::external_link_3",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::logo_uri_5",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::mutability_config",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::external_link_4",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::auth::singlesig::scheme",
          type: "value",
          item: "0x0200000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::active_burn_policy_proc_root",
          type: "value",
          item: "0x706d5f4aa0f6a2b56add9bc7ed63e0808d0b0ae1a0ce6741bfc69c91b58c71a8",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_description_3",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::allowed_send_policy_proc_roots",
          type: "map",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::logo_uri_6",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::allowed_burn_policy_proc_roots",
          type: "map",
          item: "0x0100000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [
            {
              key: "0x706d5f4aa0f6a2b56add9bc7ed63e0808d0b0ae1a0ce6741bfc69c91b58c71a8",
              value:
                "0x0100000000000000000000000000000000000000000000000000000000000000",
            },
          ],
        },
        {
          name: "miden::standards::faucets::logo_uri_0",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::external_link_1",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::logo_uri_1",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_description_5",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::fungible::token_config",
          type: "value",
          item: "0x00008a5d7845630100008a5d7845630106000000000000002141030000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_description_1",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::auth::singlesig::pub_key",
          type: "value",
          item: "0xc7bc541667cc9f6a45e1bc0e348cee621fde941b117125cb7da000a68173a119",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_description_6",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::inspection::storage_schema::commitment",
          type: "value",
          item: "0x2c286f998c003d5360daf8ffbda91061d64ac693925a5abb7774adeffad86a5a",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::logo_uri_2",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::external_link_0",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::external_link_6",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_name_0",
          type: "value",
          item: "0x034d444e00000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::allowed_receive_policy_proc_roots",
          type: "map",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::policies::policy_manager::allowed_mint_policy_proc_roots",
          type: "map",
          item: "0x0100000000000000000000000000000000000000000000000000000000000000",
          mapEntries: [
            {
              key: "0x7b9b7aa3e92412e3c8dd53c88bf462e6f2e04e3afbf4a04c4742e131afa1a034",
              value:
                "0x0100000000000000000000000000000000000000000000000000000000000000",
            },
          ],
        },
      ],
    },
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: "0xeeb4423f7b7de191792386e0967110",
      name: "Wallet A",
      address: "mtst1arhtgs3l0d77ryteywrwp9n3zqa7r5mt_qr7qqq9wr6w",
      identifier: "mtst1arhtgs3l0d77ryteywrwp9n3zqa7r5mt",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      fungibleAssets: [
        {
          faucetId: "0x2cf0bcc168cd15915a34789a754b3f",
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
          item: "0xd377c6d35bf7498796739147d950878b82d46414fa93aaa3752961182b7d6657",
          mapEntries: [],
        },
        {
          name: "miden::standards::inspection::storage_schema::commitment",
          type: "value",
          item: "0xb5724e35b8267d3be6bfc7d0ce50bfd6cce52de6da9f9e847ab24ac1bf7770f1",
          mapEntries: [],
        },
      ],
    },
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: "0xe1305924cae1d6d1647adf0d6d3a1b",
      name: "Wallet B",
      address: "mtst1arsnqkfyetsad5ty0t0s6mf6rvpd8xey_qr7qqq9wr6w",
      identifier: "mtst1arsnqkfyetsad5ty0t0s6mf6rvpd8xey",
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
          item: "0x888d95d53ba84ec498549b603f0ce53f8604f3ef06e2773fd8ddd0b821c9d6ea",
          mapEntries: [],
        },
        {
          name: "miden::standards::inspection::storage_schema::commitment",
          type: "value",
          item: "0xb5724e35b8267d3be6bfc7d0ce50bfd6cce52de6da9f9e847ab24ac1bf7770f1",
          mapEntries: [],
        },
      ],
    },
  ],
  tutorialId: "transfer-assets-between-wallets",
};

export default state;
