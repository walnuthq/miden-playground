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
      id: "0x3b9b49c51948ded13d374a9b497e96",
      name: "MDN Faucet",
      address: "mdev1aqaekjw9r9yda5faxa9fkjt7jcyt2gyx_qr7qqq9wr6w",
      identifier: "mdev1aqaekjw9r9yda5faxa9fkjt7jcyt2gyx",
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
          item: "0x00e1f5050000000000008a5d7845630106000000000000002141030000000000",
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
          item: "0x758cd2ec80459131ecb84c2a9f7904c7e4a6677264542c6d05d551ac36b169b6",
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
  ],
  tutorialId: "create-and-fund-wallet",
};

export default state;
