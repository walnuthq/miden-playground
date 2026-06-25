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
      id: "0x22631cf9de6f9c5139aabd91e80f6c",
      name: "MDN Faucet",
      address: "mtst1aq3xx88emehec5fe427er6q0dsgqtkam_qr7qqq9wr6w",
      identifier: "mtst1aq3xx88emehec5fe427er6q0dsgqtkam",
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
          name: "miden::standards::access::pausable::is_paused",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
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
          item: "0x559f8b112ee115e823cf89f1a775b90d63260a46f0629bf533af79f3bd7318d2",
          mapEntries: [],
        },
        {
          name: "miden::standards::faucets::token_description_6",
          type: "value",
          item: "0x0000000000000000000000000000000000000000000000000000000000000000",
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
          name: "miden::standards::metadata::storage_schema::commitment",
          type: "value",
          item: "0x03d6d88c00b976b58d898932682b2e1d618d10ce53c5727b9216fe330a6e5c95",
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
      id: "0x689992392bfa9d710f7805b540e68c",
      name: "Wallet A",
      address: "mtst1ap5fny3e90af6ug00qzm2s8x3sd9uvkj_qr7qqq9wr6w",
      identifier: "mtst1ap5fny3e90af6ug00qzm2s8x3sd9uvkj",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      fungibleAssets: [
        {
          faucetId: "0x22631cf9de6f9c5139aabd91e80f6c",
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
          item: "0x916cefb7f71378422d726c50b1dd6b4dafcb6bda5df0c779dec8a6ed05f19376",
          mapEntries: [],
        },
        {
          name: "miden::standards::metadata::storage_schema::commitment",
          type: "value",
          item: "0xb5724e35b8267d3be6bfc7d0ce50bfd6cce52de6da9f9e847ab24ac1bf7770f1",
          mapEntries: [],
        },
      ],
    },
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: "0x57a3ba86c7bd1cf1149fbd905c19a1",
      name: "Wallet B",
      address: "mtst1apt68w5xc773eug5n77eqhqe5ykct7hd_qr7qqq9wr6w",
      identifier: "mtst1apt68w5xc773eug5n77eqhqe5ykct7hd",
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
          item: "0x6bc5fe529e68b2e657fca74adf32a5a79c26b83430caeb0d1c52403b96ad1958",
          mapEntries: [],
        },
        {
          name: "miden::standards::metadata::storage_schema::commitment",
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
