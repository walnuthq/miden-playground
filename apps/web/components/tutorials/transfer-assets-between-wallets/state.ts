import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import {
  basicWalletAccount,
  basicFungibleFaucetAccount,
  midenFaucetAccount,
} from "@/lib/utils/account";

/*const sta: State = {
  serializedMockChain: "",
  accounts: [
    {
      id: "0x2cf0bcc168cd15915a34789a754b3f",
      name: "MDN Faucet",
      address: "mtst1aqk0p0xpdrx3ty26x3uf5a2t8ug0x2rl_qr7qqq9wr6w",
      identifier: "mtst1aqk0p0xpdrx3ty26x3uf5a2t8ug0x2rl",
      routingParameters: "qr7qqq9wr6w",
      isFaucet: true,
      symbol: "MDN",
      decimals: 6,
      maxSupply: "100000000000000000",
      totalSupply: "100000000000000000",
      isPublic: true,
      isPrivate: false,
      isRegularAccount: false,
      isNew: false,
      nonce: 2,
      fungibleAssets: [
        {
          faucetId: "0x18101fa522c174b165efd4f70a0385",
          amount: "99999762",
        },
      ],
      code: "0xad98b229e2a1bb6bfa9b5e9565489268befffdccbd6d0fb47c2b83347f1ac0ca",
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
      consumableNoteIds: [],
      components: ["auth-single-sig", "basic-wallet", "fungible-faucet"],
      updatedAt: 1789072654395,
    },
    {
      id: "0xeeb4423f7b7de191792386e0967110",
      name: "Wallet A",
      address: "mtst1arhtgs3l0d77ryteywrwp9n3zqa7r5mt_qr7qqq9wr6w",
      identifier: "mtst1arhtgs3l0d77ryteywrwp9n3zqa7r5mt",
      routingParameters: "qr7qqq9wr6w",
      isFaucet: false,
      symbol: "",
      decimals: 0,
      maxSupply: "",
      totalSupply: "",
      isPublic: true,
      isPrivate: false,
      isRegularAccount: true,
      isNew: false,
      nonce: 2,
      fungibleAssets: [
        {
          faucetId: "0x18101fa522c174b165efd4f70a0385",
          amount: "99999762",
        },
        {
          faucetId: "0x2cf0bcc168cd15915a34789a754b3f",
          amount: "100000000000000000",
        },
      ],
      code: "0x9ad6ab2c87895ed3697f616131b5d381d1447b76fae66c897e0fcd1bdd66eaf3",
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
      consumableNoteIds: [],
      components: ["auth-single-sig", "basic-wallet"],
      updatedAt: 1789072654395,
    },
    {
      id: "0xe1305924cae1d6d1647adf0d6d3a1b",
      name: "Wallet B",
      address: "mtst1arsnqkfyetsad5ty0t0s6mf6rvpd8xey_qr7qqq9wr6w",
      identifier: "mtst1arsnqkfyetsad5ty0t0s6mf6rvpd8xey",
      routingParameters: "qr7qqq9wr6w",
      isFaucet: false,
      symbol: "",
      decimals: 0,
      maxSupply: "",
      totalSupply: "",
      isPublic: true,
      isPrivate: false,
      isRegularAccount: true,
      isNew: false,
      nonce: 1,
      fungibleAssets: [
        {
          faucetId: "0x18101fa522c174b165efd4f70a0385",
          amount: "99999881",
        },
      ],
      code: "0x9ad6ab2c87895ed3697f616131b5d381d1447b76fae66c897e0fcd1bdd66eaf3",
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
      consumableNoteIds: [],
      components: ["auth-single-sig", "basic-wallet"],
      updatedAt: 1789072654395,
    },
    {
      id: "0x18101fa522c174b165efd4f70a0385",
      name: "Miden Faucet",
      address: "mtst1aqvpq8a9ytqhfvt9al20wzsrs56g83ec_qr7qqq9wr6w",
      identifier: "mtst1aqvpq8a9ytqhfvt9al20wzsrs56g83ec",
      routingParameters: "qr7qqq9wr6w",
      isFaucet: true,
      symbol: "MIDEN",
      decimals: 6,
      maxSupply: "100000000000000000",
      totalSupply: "0",
      isPublic: true,
      isPrivate: false,
      isRegularAccount: false,
      isNew: true,
      nonce: 0,
      fungibleAssets: [],
      code: "0xad98b229e2a1bb6bfa9b5e9565489268befffdccbd6d0fb47c2b83347f1ac0ca",
      storage: [],
      consumableNoteIds: [],
      components: ["auth-single-sig", "basic-wallet", "fungible-faucet"],
      updatedAt: 1789072137629,
    },
  ],
  transactions: [
    {
      id: "0x343c71a832c564e8f8dadd938a6f061e4c10cd3f7828421e77067e2db301190d",
      status: "Committed #44000",
      accountId: "0xeeb4423f7b7de191792386e0967110",
      scriptRoot: "",
      inputNotes: [
        {
          id: "0x472fff7af57f34202a05ef5559df8edff352ee2703ee0c55f8266c7c96dc0bd3",
          type: "public",
          scriptRoot:
            "0x124bbbfc18271834c6efe9b067e2e7ea3eda90030ef0c60fef906a019d39958c",
          senderId: "0x2cf0bcc168cd15915a34789a754b3f",
          fungibleAssets: [
            {
              faucetId: "0x2cf0bcc168cd15915a34789a754b3f",
              amount: "100000000000000000",
            },
          ],
          storage: ["8728968801928941568", "17200445717256987025"],
        },
      ],
      outputNotes: [
        {
          id: "0x3b2f6be9c7394cc4c752c2a1ae677b7d4f01738c725b352a1fd5734905233b7f",
          type: "public",
          scriptRoot:
            "0x0755d7eff6428993e6fe66ff039d0cbee16a3b25f7f4d3c430a956a87a6fd6aa",
          senderId: "0xeeb4423f7b7de191792386e0967110",
          fungibleAssets: [
            {
              faucetId: "0x18101fa522c174b165efd4f70a0385",
              amount: "119",
            },
          ],
          storage: [],
        },
      ],
      updatedAt: 43996,
    },
    {
      id: "0x686244e964856ed9876864a84c76433b6d8b99c93bd3694d2bd321bbe95cc542",
      status: "Committed #43988",
      accountId: "0x2cf0bcc168cd15915a34789a754b3f",
      scriptRoot:
        "0x09e161442bd3968c6c8173cb264a8a367fc6fa0be41a151f2da94c424f46fe59",
      inputNotes: [],
      outputNotes: [
        {
          id: "0x472fff7af57f34202a05ef5559df8edff352ee2703ee0c55f8266c7c96dc0bd3",
          type: "public",
          scriptRoot:
            "0x124bbbfc18271834c6efe9b067e2e7ea3eda90030ef0c60fef906a019d39958c",
          senderId: "0x2cf0bcc168cd15915a34789a754b3f",
          fungibleAssets: [
            {
              faucetId: "0x2cf0bcc168cd15915a34789a754b3f",
              amount: "100000000000000000",
            },
          ],
          storage: ["8728968801928941568", "17200445717256987025"],
        },
        {
          id: "0xe813fc0bc57d59de851a41085e4fffcda333847e17a262041f5ed1727221a912",
          type: "public",
          scriptRoot:
            "0x0755d7eff6428993e6fe66ff039d0cbee16a3b25f7f4d3c430a956a87a6fd6aa",
          senderId: "0x2cf0bcc168cd15915a34789a754b3f",
          fungibleAssets: [
            {
              faucetId: "0x18101fa522c174b165efd4f70a0385",
              amount: "119",
            },
          ],
          storage: [],
        },
      ],
      updatedAt: 43983,
    },
  ],
  inputNotes: [
    {
      id: "0x966ab98ffdcddcf655332c148214134e5ddc1e36166a6247cfbf158e93625ea3",
      type: "public",
      state: "consumed-authenticated-local",
      tag: "3778019328",
      serialNum:
        "0x190088c81a2dcb9df6d9ed9defd444292eae147c20a7db94779f686bab9f1476",
      senderId: "0x18101fa522c174b165efd4f70a0385",
      scriptRoot:
        "0x124bbbfc18271834c6efe9b067e2e7ea3eda90030ef0c60fef906a019d39958c",
      scriptId: "p2id",
      fungibleAssets: [
        {
          faucetId: "0x18101fa522c174b165efd4f70a0385",
          amount: "100000000",
        },
      ],
      storage: ["7240344599711587072", "16226567471973390033"],
      nullifier:
        "0xe810f5c7feabaef747f460bf71629159ae07a2eb7bda8f4066a4747befda90e1",
      noteFileBytes: "",
      updatedAt: 1789072392258,
    },
    {
      id: "0x472fff7af57f34202a05ef5559df8edff352ee2703ee0c55f8266c7c96dc0bd3",
      type: "public",
      state: "consumed-authenticated-local",
      tag: "4004773888",
      serialNum:
        "0xf8e5e2aa47a21e1aaf4d5f5ebcc75dffb3887f340238c80b3338b627348409e2",
      senderId: "0x2cf0bcc168cd15915a34789a754b3f",
      scriptRoot:
        "0x124bbbfc18271834c6efe9b067e2e7ea3eda90030ef0c60fef906a019d39958c",
      scriptId: "p2id",
      fungibleAssets: [
        {
          faucetId: "0x2cf0bcc168cd15915a34789a754b3f",
          amount: "100000000000000000",
        },
      ],
      storage: ["8728968801928941568", "17200445717256987025"],
      nullifier:
        "0x6a5c24fdc2acca5a0547273eba0362f5f9a396a2f4a923247d09f651c9d120f8",
      noteFileBytes: "",
      updatedAt: 1789072576666,
    },
    {
      id: "0xcbc9412beb4f0086a3f5da2416b5229c4f3b62153d821145503a548a820084b6",
      type: "public",
      state: "consumed-authenticated-local",
      tag: "4004773888",
      serialNum:
        "0x93c4243492ea6c6f4210564f1225e08fc449b8a1a85d85b2dda670396b57c6f8",
      senderId: "0x18101fa522c174b165efd4f70a0385",
      scriptRoot:
        "0x124bbbfc18271834c6efe9b067e2e7ea3eda90030ef0c60fef906a019d39958c",
      scriptId: "p2id",
      fungibleAssets: [
        {
          faucetId: "0x18101fa522c174b165efd4f70a0385",
          amount: "100000000",
        },
      ],
      storage: ["8728968801928941568", "17200445717256987025"],
      nullifier:
        "0x5562cadc5774bf567e7b04057cc1dfe5bd863a56f8fc589074620ac7b9ad7601",
      noteFileBytes: "",
      updatedAt: 1789072366846,
    },
    {
      id: "0x107e7864d43264a10c9d1e61d5f446f843ca0f3633c7e229679b91341db3d12b",
      type: "public",
      state: "consumed-authenticated-local",
      tag: "753926144",
      serialNum:
        "0x407e41109e79d3c3fe0f06464885c370a6e8c3ef575824ddbdd0a32b77bd50ee",
      senderId: "0x18101fa522c174b165efd4f70a0385",
      scriptRoot:
        "0x124bbbfc18271834c6efe9b067e2e7ea3eda90030ef0c60fef906a019d39958c",
      scriptId: "p2id",
      fungibleAssets: [
        {
          faucetId: "0x18101fa522c174b165efd4f70a0385",
          amount: "100000000",
        },
      ],
      storage: ["6499952766990630656", "3238295670952367505"],
      nullifier:
        "0x9e538aed008c4b5daa7d213d62537d7af2426d3e42c3e5351f5052efabd15f22",
      noteFileBytes: "",
      updatedAt: 1789072321168,
    },
  ],
  scripts: [],
  components: [],
  tutorialId: "",
  tutorialStep: 0,
  tutorialMaxStep: 0,
  tutorialOpen: true,
  nextTutorialStepDisabled: true,
  completedTutorials: ["create-and-fund-wallet"],
};*/

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
