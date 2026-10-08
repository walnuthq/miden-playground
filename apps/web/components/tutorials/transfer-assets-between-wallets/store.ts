import type { Store } from "@/lib/types/store";
import { defaultStore } from "@/lib/utils/store";

const store: Store = {
  ...defaultStore("mtst"),
  accountCode: [
    {
      root: "0x11c7922301765b70d384d3fa33d0eebfae0947540e003bd028026acdc6473ece",
      code: {
        __type: "Uint8Array",
        data: "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",
      },
    },
    {
      root: "0xd907718ecd4b88aceef87c6597c9f968cb6d9661d56dc61a68edf4704e0acbaa",
      code: {
        __type: "Uint8Array",
        data: "CpcJCpQJTUFTVAAAAAQhFQsZAAAAAQAAAAcAAAAGAAAACAAAAMcJW9MzBQevrqBwW6FQU3RqUOJxAAABAAAAAxAAAAkLDSkpKTEBAAAABQAAAAAFCBMBAAAAAgAAAAADEwEAAAABAAAAAAspW+YHGvs8ktTEW8yTcweBD69KAAABAAAABBAAAAkAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAAAwHgAAAAAAADAtAAAAAAAAMDkAAAAAAAAwRAAAAAAAADAKAADAAAAAAAsAAEABAAAAEAAAwAMAAAAMAAAAAAAAAA0AAAABAAAAEwAAgAQAAAAUAABABAAAAA4AAIAAAAAACQAAQAEAAAAXAACABQAAABgAAEAFAAAAVKVjJ/kuaDJu+nr8Hjr9xKcODTIpwt4HqUCPAEf2eAfXQWt5inCqu8pRDDzQ9IujVHO1123DAjdRV8b1Y//8FRJOvxG/O8CZydFYu7xlAiSuLmhT9bJH12+HxyPqgVpCjBgYK/2OfkFvjFUSitoD9UXVBd1jmlKFCrW2zkhsuEsagEZB7lc0QiebDc0IhQwVQDQ7dsjcq+td3Iyne8WWYcBHXFbBn3F1J7DCfxFTxuyLqXMBfAlSJpteONje67mUJ2Qbeciux+wpggyQfrXAUTS30Cz2nn5zpbfc0JyAOpXyYee90fruXbOwq+S7Z7FT+8puzj5Fa4Pv+YaX8h9ql6k+Wxu9gA6goLP32/h+Wletzo0pDGZxji8LkoSrUPvu/kXPZSgZNaENnmoBvNN+1z9lDzjNDvmH4Lxy0mpeRvp0j+NiMWp74HT7Ag6ccYPz6U4hVa22gVrsYDR92g/ZkgVsZt4ijGEJWKAU2B+a3fG3/IyJlpMVrLKabUXrvkjOfao/CWbLU0ZFlYfp3zeYlFcR9wiRfgB8aeiMnJZrcpUEZOFGMMIXHCVPY+Mi6cVu/j2RNw+PjvcJWKAD4gkQuNc7C9AZ/LczahrXB760xut1VVQSiLZ7pbblRwxh9R5DqURNd9DAsrlbewNEbTBbKSdLrWQmrVXXbx98Wtriore9acj+MQvLrVRwBOR8lu50MPbwOEx2ViD0hlIr0LyU881YPPZh5YA63/MkpUybSeO6rTS9n9srUM2cCfSdPjsgDp5W/3yiGrTPzhagjQxFLWShn2yfFWVVi3HcGK7JF8MEuiBX3jC7pRSU5QxrqCJQV3/9x3oKVkfeoq2EpKAcBXq0tybsVUNnmA0Xf5prbjeM8RU4Tdr9/Xz091Q8Dmli8dec9/ZYHupGmf0bkGxdkqhXmUolPSKIkcw5BN/CkpWq85DjB2/15nc9Wt5zu5B1GzFySZ2m/tbjvsfzNs/sWJEZ7ljJ1V+HGgBWl7s0iXC+chAcxl0Ru3P5EOWQSCkmMqg9nAZRAdDnrrHZaQITEBnds1Kqru8p5tXiW8YuY0fveOBQ6KAIYRVRn8FEDvbybZS2MpKk1V8Koc00UXd1ZQESIgog73jgUOigCGEVUZ/BRA728m2UtjKSpNVfCqHNNFF3dWUSIgog10FreYpwqrvKUQw80PSLo1RztddtwwI3UVfG9WP//BUSIgogJ2Qbeciux+wpggyQfrXAUTS30Cz2nn5zpbfc0JyAOpUSIgog8mHnvdH67l2zsKvku2exU/vKbs4+RWuD7/mGl/IfapcSIgogqT5bG72ADqCgs/fb+H5aV63OjSkMZnGOLwuShKtQ++4=",
      },
    },
  ],
  latestAccountStorage: [
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::auth::singlesig::pub_key",
      slotValue:
        "0x18f453d67dbba0f639abbc6f982c54a613d43e227a8f95c56f4b66a37aaa974b",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::auth::singlesig::scheme",
      slotValue:
        "0x0200000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::external_link_0",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::external_link_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::external_link_2",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::external_link_3",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::external_link_4",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::external_link_5",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::external_link_6",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::fungible::token_config",
      slotValue:
        "0x00008a5d7845630100008a5d7845630106000000000000002141030000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::logo_uri_0",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::logo_uri_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::logo_uri_2",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::logo_uri_3",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::logo_uri_4",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::logo_uri_5",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::logo_uri_6",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::mutability_config",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_burn_policy_proc_root",
      slotValue:
        "0x706d5f4aa0f6a2b56add9bc7ed63e0808d0b0ae1a0ce6741bfc69c91b58c71a8",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_mint_policy_proc_root",
      slotValue:
        "0x7b9b7aa3e92412e3c8dd53c88bf462e6f2e04e3afbf4a04c4742e131afa1a034",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_receive_policy_proc_root",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_send_policy_proc_root",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_burn_policy_proc_roots",
      slotValue:
        "0x99be6a3dc7233a8ace40e5bb7a553489bcfc4568f62d1ea9134fdbba89bf6d8f",
      slotType: 1,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_mint_policy_proc_roots",
      slotValue:
        "0xd8da92b7e364fbfa344279ad591f5d7e8d527693e0cd89eb7aeed63f9f15fe3e",
      slotType: 1,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_receive_policy_proc_roots",
      slotValue:
        "0x2d2a45733b612b370c67837c9e92262316d7ef884d02a624418fee262203da9a",
      slotType: 1,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_send_policy_proc_roots",
      slotValue:
        "0x2d2a45733b612b370c67837c9e92262316d7ef884d02a624418fee262203da9a",
      slotType: 1,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_description_0",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_description_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_description_2",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_description_3",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_description_4",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_description_5",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_description_6",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_name_0",
      slotValue:
        "0x034d444e00000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::faucets::token_name_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName: "miden::standards::inspection::storage_schema::commitment",
      slotValue:
        "0x0f5c203f2b0bba623df8ead5f75523d6ae3dfb4806cc560806f972f8b4c3dbc4",
      slotType: 0,
    },
    {
      accountId: "0xafaf4cb2ab65621128c868fc5e4d94",
      slotName: "miden::standards::auth::singlesig::pub_key",
      slotValue:
        "0x7b312911c68fe39c1df1f65858ee1a3f6e34d4b6c82e3c43f8abd932497094e8",
      slotType: 0,
    },
    {
      accountId: "0xafaf4cb2ab65621128c868fc5e4d94",
      slotName: "miden::standards::auth::singlesig::scheme",
      slotValue:
        "0x0200000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xafaf4cb2ab65621128c868fc5e4d94",
      slotName: "miden::standards::inspection::storage_schema::commitment",
      slotValue:
        "0xb5724e35b8267d3be6bfc7d0ce50bfd6cce52de6da9f9e847ab24ac1bf7770f1",
      slotType: 0,
    },
    {
      accountId: "0xc4266cf766bb02910d19cdb8a215a3",
      slotName: "miden::standards::auth::singlesig::pub_key",
      slotValue:
        "0x61c588cbd7507ec527e70b0f69109076bfb314aad4956b66f232016dacce6e30",
      slotType: 0,
    },
    {
      accountId: "0xc4266cf766bb02910d19cdb8a215a3",
      slotName: "miden::standards::auth::singlesig::scheme",
      slotValue:
        "0x0200000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xc4266cf766bb02910d19cdb8a215a3",
      slotName: "miden::standards::inspection::storage_schema::commitment",
      slotValue:
        "0xb5724e35b8267d3be6bfc7d0ce50bfd6cce52de6da9f9e847ab24ac1bf7770f1",
      slotType: 0,
    },
  ],
  latestStorageMapEntries: [
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_burn_policy_proc_roots",
      key: "0x706d5f4aa0f6a2b56add9bc7ed63e0808d0b0ae1a0ce6741bfc69c91b58c71a8",
      value:
        "0x0100000000000000000000000000000000000000000000000000000000000000",
    },
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_mint_policy_proc_roots",
      key: "0x7b9b7aa3e92412e3c8dd53c88bf462e6f2e04e3afbf4a04c4742e131afa1a034",
      value:
        "0x0100000000000000000000000000000000000000000000000000000000000000",
    },
  ],
  latestAccountAssets: [
    {
      accountId: "0x198b951cb9040a5178324da5347d5a",
      vaultKey:
        "0x00000000000000000000000000000000113664ae4d228274310a5fe7ffcabd4c",
      asset:
        "0x2226000000000000000000000000000000000000000000000000000000000000",
    },
    {
      accountId: "0xafaf4cb2ab65621128c868fc5e4d94",
      vaultKey:
        "0x00000000000000000000000000000000113664ae4d228274310a5fe7ffcabd4c",
      asset:
        "0x9926000000000000000000000000000000000000000000000000000000000000",
    },
    {
      accountId: "0xc4266cf766bb02910d19cdb8a215a3",
      vaultKey:
        "0x00000000000000000000000000000000113664ae4d228274310a5fe7ffcabd4c",
      asset:
        "0x2226000000000000000000000000000000000000000000000000000000000000",
    },
    {
      accountId: "0xc4266cf766bb02910d19cdb8a215a3",
      vaultKey:
        "0x00000000000000000000000000000000115a7d34a54d3278510a04b91c958b19",
      asset:
        "0x00008a5d78456301000000000000000000000000000000000000000000000000",
    },
  ],
  accountAuth: [
    {
      pubKeyCommitmentHex:
        "0x18f453d67dbba0f639abbc6f982c54a613d43e227a8f95c56f4b66a37aaa974b",
      secretKeyHex:
        "02590820bd13df7df3e07e0befcf13f0060be03f07ef02ffd181f0507fec4f8323f042e83f44f43f07f400c5d7cf38f05e42efef7c07e043103ffe07c0041400c310417c0bf0ff101d3c07ff7d203fbf0ca204f38f40041f7813c0800fdefe0fa0c217ff810c0002f8420203df7defc07bfc123d07d001f01f06ef7f83106103fffeff0c3f4504308123807f07f0c7fc0f80f41e8efc1ebdf38fbcfbef3afff001f45f7dfbf036078103f3e1830fff030c51031fc0fafff0410c6ebefc20fcfbffc3fb9ffa0fae820bdeffffdebafff04c0c4144f83f42204eff1fd1c700503aefa0c30821411c204203bf8913b002f48fbd13cf00087ec40c4f8a0871430c4f78183040fbdf83fc4106ec2ffdffef430c2203e7f27f000e3bffe082f41e42ec5fbd23e0bd186fc31bbf3df4a03a206242002fbb10103bebbfc317df010fa086ec2efdfc107f17fc82103d00fff0ba1c3102005efef800831bbfc00001380030c1fff083185086f86fc20360fcf040460c1ec4f7d000efc0bf0f9ffcfbf176e830440bc1fb03af04148f420c113df81001fbf100fffdfff41f0507ee400f9f02dc0f7ae8307bf44f400c817a07a10003e17f042fff03c041fbb13dffff3f182fc00c0e45dbfd7b0c0f03e43fc1002ec1f7aff7ffcfc323a0fd03f084fbbf0007b1440bcf400bbf8200027b101d82f860800810bc07e0410fefbe106ec1f04efc0820ff042f3ef02ffee831871031ff0fbf3aebc0ff17de40080f75fc0f3eefe0fc0c113a083003f84e85f7e1bf0c2f030bdfbf0c00c2f7cf08e00f7f08118013bf7c03d13d13f140100effffde80fc00ffffff7e041f3f08113d14200903d084004f3c0fffc017febd0bfebe1bd03af8107f10203feff1bb1c4f7af7bebe07a0fff7eefa0050c2f7e0fd1bff801bdf3d1bd003fc50c0e0223cffe0441bbf3c17cf4000607df7eebe0c1f06fc2fc10ff07e0be0bf13c0030be07f202003fc6fbe0baf7ff83f0100208107d17ffbf042fb8046f3c04018007efc2fc11be1c0fbe03bffcf3df7c07cfbd04403ee80e44042ec30be206f3b143000ffbf7b0c2ec1078dfe0e0b230b000eebfbe10e3bf1141a2011ffeeff172d0704e7ebe30c2ee119dee1080604010716ba0b0cee00e3f80d08ff2015f81adaf1f325faf7ed052504f8fc08fafceb16def7cffaef08fd13f70a180df8c2cdd1df00ea19e7b7c0c42b1f0bfbc708fb0f04021e24d31e0133ffece5031bf93b20fcf0f4fc18c4080d04ebfff8e7ce11e3eaf4f12d10f80be2fcdfc70019f5e0c809d10ff3e5f0ffeb3530110624420a1f29fc13180adc3f42041afcfa0fd6d225f1e70647fef10b3b00eafe1ef6c6e2091028e2f1fee401fafbcf0ceced250615181a10ece9110c2f0a1ee71eec0d1d2412fd0ae009f2e0ee0bee1f1f1903e2d00812d42a0808daf8f3d903ecf7e6f9161bd8f1fa11f3f812ece6dc0d1cf0e508f628f213c5e00eec03341ce20ddaf41214eb040dee253204ddcadfbfc8122e030ff80e051303faf7fb1207e8f8050b0f1903e4f31af3e341f9f9041105eff9cc24131834fdfaf5df10320103f9d913f4f2f0eef3b62d0e3ff332130709e718f1d7ee17321504c204053d161908c0b3e9ed210aeb1ff624fdf31001fc2329fdfae5e91323d9f62b20ecfdeaedf8dadcf0f108fbed25ed11dff9082826fcede4effcdafafc19cbf7d0fd37010ee80b1cfcf811fdd1fc04f71adef7e9efd20a1ee4fe0903c6e7f4feeb0805001923ffc7002dfc1ff407ffcffffbefe6f00f06f31be711effa04fa08e4f903dd",
    },
    {
      pubKeyCommitmentHex:
        "0x61c588cbd7507ec527e70b0f69109076bfb314aad4956b66f232016dacce6e30",
      secretKeyHex:
        "0259e81084f48f01dff13ff3efc8fffec21fd13ffbd1c5f0003a0430b8ffafbd0bcf3d046fc9f010c3fbdf42dc3f76139f85dc51401fefbaf3d0c2fbf0c1f43e3c0c5f7c0b6e7c1c2080f4404107e143f40e41ec10bd005fc808100504717b0fbf7e139f01ebf13a0fcfff0be0012010c5d460c013f1c80f70bef3e03e17e1ff17c07ff79e7ef7b0fc0bdffd1fff7e003f80103e4514600407d03be7dec607817e0c207c03d17cec0ec30000400be0c00bc0001bd083038e78041f81044f010bff05281100083f000bf13dd85dc107cf40fc4fbb0bf0bd046fbee3c10407c04113cf85181fcd03a0be081ff70be07b13dfc113e13f07d10013fec3ebf205ecaf3ff840c0078f40101040f40f7f0fbf020412f917df45f83fc01ffffae3c03d0fd043e7ff0203b0c123d13d0450bf07f147f44100dca0400c40feffff80f820fff7fe400c4082006ff50f6f00042f011801090f703f1b7d38038f00f3be4307ff85fbf03ff800c10c6fc8efaec30c3fc5f4500917cec4ef70bb006083fbc0c10021420bd104f03fbb102f400fc0c5185001ebf0c5e41ebff0207df410bde4103ffc3042f83ec4f830000fc0c503d2b9002e80f0decaec4fc004323d0fef030420faf810391c10c4e85100043f41047efd1bb07a144ffd07f08104003f10107d0fe0f3ec00430bd082e40ffffbc0780befc5f801000feefb0c3f3a0be0c20fcffe1c4f81ec1f81fc61c100020003f08207dfbc1c3ffee8308314200007cffef3b07e1861c2004e4220503f2c22440b7f801060b803d04910114707eefe1460bd23e0fe0420c11002bc001f44081d84ebde82fc1101d7afc1183eff181f43fc4ec3f8207f0fdf3cf04ec4088e46007f44ec0fc307f0fb1bfffdef90f9fbafbf0fae800c00bd0010bd0020c303703de81f81f040bf0b7f7e1ff0bef3c03d005040f7e14af01f7cfbe079fc003f182086ffa0c3efdfc2f01efcec0f3bfc4f420820fd03d03f000fc007c049f81f80fc0108fc1fc500003ff7c07bf7dfbbf8313f084fc50fb0400c0ef80be27f0411bd142fc11fc23cffcffc0ffe80140f7ef4303f00307b070bf3e7e8fdffc6f9f2eb1bf9ea0cc1e8dff5f417e90bebf01a07ca10fb2d230f3c0ef726cfe0e10614130ee905f10feefe0629ea00eef5f4dd1cf910f12a2edb1609cbde2ad51ed937f1e7300f1e00f10ce602d3f5f6d410330806001d28f110de0dfe152efbef08fff0f4fbf812e8e41803e3df27d3320c1cff05fc0cd5e1fb2f07202012e31c1d23f60d2104021be70cdfe8d7f601ebf201f8f022dfe5c308001d05fdeffe26ddec081107510eeeed0b0ec90df400f005ebab1ac400f9f1f4f9cd00130f2600f305f7160728e2e929ecf50afa2304460d45f4e2280acdc8ede811ff060509c5f52535e110d926f529072a131627180719e502f5ee18efdcfbfd2a26f33bd91e2a04ede8e31ad1191424f902f844ca0633141ce83718f3ff070138d910f41eebd8ce04f412d2e8f4cf101220f91209102614fd0ee62803e5f5ecf1241011fc0c12e531d9fafbe50be9fde0f20b0cfafd1a2307cb5800e0d8ff00ef18d62a02daf6d90c06f526f6e50ae80707f9d7f5f20104fe1308120437f209f21c1fe21af4d9e6e6f722fcf9e91725eaf2e2e0f3f4fc1402051a09eceb032a32f6f8e83003311a25fe1ed503fc09f5e3fa2203efe8091c29d82ce00d11fbebbce716e5141fee2104f5fdedfe14d91ae412dc2cd80b06063706ea011d2a01e102f6e512382011ed17eb31cffde5110ef2fedeb800f410ff08fc1eff09ea",
    },
    {
      pubKeyCommitmentHex:
        "0x7b312911c68fe39c1df1f65858ee1a3f6e34d4b6c82e3c43f8abd932497094e8",
      secretKeyHex:
        "0259ec30ff280f3d0bc00317ceffffcefd07df3e00400218103beb9040fbd17f1bf240f7a03effdf3cebefcaf410beec2ffd07ff7e13b00007e0410bd0bd380086f3dfc2efce81e820c2f40e84004f4107c03c239005f44f4003fe420ff0fc1c4ffdf3febde4107fe38f3810114310627ed7ee41f4023f0810fdfc0ffd1fff860fc23ff440fdf3ff401c0f3f104185fbc035ebd07edfbfc103bf7d03ef7e17ff3e144f84fbd0480fefba0420810c40fe0000c0084f3dfc2fc0ffcfc308104107eefc13effee7df02f800c6f0323ef86f87ffd082f3cf39fc5f400fffff14110103d17ffc00fff3eff9041e82f4507af01e82e81fc40c0eff17ef7efc01011c2fffebc13e1fdfff07b003001f7f037f3cf7ffbef3f041fc7142ec12fef842bf206ff9045e0018218623e003fc0079fc5ffe200fbc0bc0011bd105fbe00413dfc41bcf38fbb0ff001f41039f05f01f7d04303e03ff82003101ffdf8208318113ff8223efc6102fbe07ef7c08af43fbfe84002f42000f3e00014af031bcf87ffee48f3cfbef03efdfc11000c0e7a002efc0bf1092b9fc023b002046009f461fd0c4fc5dfe28113cfbdfbdf3f0c0f41002ffff84ffc1020fa0c413903ee7ff01f05fc51431bc13c087fc2e3fe83f81ffb03eebafbaffbffc148f00ebf143080efb07e04303cf830bd13debc13af411fbfc1083103fb8003e04f031c20bffc2fc3f7aff8fbe17f03eebae3e07ff81fff27c1010790c5f78fff1fb0bd103185fbe08303effbf84efe00703b044041f4013f145144ffcfbd085206dfaffe1fefc00c8f3df05042f7f07f0be138e03040f04081009e7e043fbc105043e47f02086e7e0bd07703ce7a0c2fbf101e831490fa07cfc2f80e4408303efbf03ef01043ebdec1fc200217bf7b17f03ffffe7c03a0c21c607df811430781ba0c1000005d8113df43f460050fc0c0142277f8103e14208113efbff04f7d1be17c13c040dfbff9efd181081188045fc507d045eb600813f1c5045fbfdc517deff046f4513fec1203fc1e471c0f7aff9f05f39fc5f7e2770c2ec0ffcdfb0c3f7bf47fb7efce890801b903dfeeeccedeedb1a112118100b16d20d17f02829e609d412efe0e02a17042adffdf8e6072024110406f0addbfcf220eb24fbfb0eda2f08fce1140f0ffd05f20409bf15252101e1fb1b0805ec02fd16ee32f2f7fb2b12ed2ae22cf22ae9fa101c1a2b1b06d7dc2427c6e522f0fbf209fdfbe310f4ec0c2a04e609161d1819180decf310eefc0f03012500feff2004f3eff5fbf30a1c2d0bdaf91af0dffd31e4050f23dc13dbe31612041220d9ecd61c180e123bf807fc02e32602f0162027eff526d9f3fc091ff2edbbdd3cfce22511fb08e5f8e60924e9101ae9171025faea1208e112f3170af1fb0e171116281c041d2be608ece3ecf6ec0b0af8f7fb00ff061318290100f6f30328150ae823fae5edeffb00fce9eb33fef21012f71deff8fa2705fe202adf10f208f14a0f0500e3dae4fd1a1e050fdcd8dee8f011f12e19000b14f508effb130c0ed804f7faef200608f50be4f7fd09e30cfc0929150af90b0d13bb0acf1d0df521fa0d0c17f9283507d5f6f5f9e9c8e50ddd1ff4dc27e8f9e01c0e1f07f905f4fb063b0d1c180ceae0ea05d91f350df848ffe41803f6e41f1b1cd9f1f6f213f0f00cebf8f414f50528e315fcfbc71b05f6d40412efeb073c10081fe9ebcf03e6f601f3e50bf9f0dcee0b180910f8fdff06ff292bf91023f4d6ecd2d5060b0eeb4dd7def51911000deae61fec0503faba10012f1c211c14fbf2",
    },
  ],
  accountKeyMapping: [
    {
      accountIdHex: "0x198b951cb9040a5178324da5347d5a",
      pubKeyCommitmentHex:
        "0x18f453d67dbba0f639abbc6f982c54a613d43e227a8f95c56f4b66a37aaa974b",
    },
    {
      accountIdHex: "0xafaf4cb2ab65621128c868fc5e4d94",
      pubKeyCommitmentHex:
        "0x7b312911c68fe39c1df1f65858ee1a3f6e34d4b6c82e3c43f8abd932497094e8",
    },
    {
      accountIdHex: "0xc4266cf766bb02910d19cdb8a215a3",
      pubKeyCommitmentHex:
        "0x61c588cbd7507ec527e70b0f69109076bfb314aad4956b66f232016dacce6e30",
    },
  ],
  latestAccountHeaders: [
    {
      id: "0x198b951cb9040a5178324da5347d5a",
      codeRoot:
        "0x11c7922301765b70d384d3fa33d0eebfae0947540e003bd028026acdc6473ece",
      storageRoot:
        "0x813bf61dd1cc056a034284069bc1ed71e9bc99feec5d6c712d36caaa1c8e47d6",
      vaultRoot:
        "0x164d8bc39ee660dd0267aed583a12d43450d2eec4fbf00522aff6db118fa63d4",
      nonce: "2",
      committed: true,
      accountCommitment:
        "0x51f36644d5738a9a9412abd37d76e7d8daaf98c1e33aaa88bf785cab00e5028d",
      locked: false,
      watched: false,
    },
    {
      id: "0xafaf4cb2ab65621128c868fc5e4d94",
      codeRoot:
        "0xd907718ecd4b88aceef87c6597c9f968cb6d9661d56dc61a68edf4704e0acbaa",
      storageRoot:
        "0xe67facdca05e117227290cab9122dde6fa0834a3856c0d0b1de3eae9c936c119",
      vaultRoot:
        "0xf147fff63fce38b8f2d403bbfd814041449f7da68d23f5011a415213b41ba6f5",
      nonce: "1",
      committed: true,
      accountCommitment:
        "0x2c5393b9f4dc621ea05c5849f0e016755c9532345e947c9492789cf4ed1ce622",
      locked: false,
      watched: false,
    },
    {
      id: "0xc4266cf766bb02910d19cdb8a215a3",
      codeRoot:
        "0xd907718ecd4b88aceef87c6597c9f968cb6d9661d56dc61a68edf4704e0acbaa",
      storageRoot:
        "0xf7f26ecdb070bc2549779379a2da6f3cdd268e77c95d6099456ec75f10fee68b",
      vaultRoot:
        "0x1c22a202d3a7da793b01550df7c075a04384aeebe894da7499b0a004dac63d48",
      nonce: "2",
      committed: true,
      accountCommitment:
        "0x90d804e93f3ae6776fab0051b1dad5789e62c2657c6de072008de14f39222283",
      locked: false,
      watched: false,
    },
  ],
  addresses: [
    {
      id: "0x198b951cb9040a5178324da5347d5a",
      address: { __type: "Uint8Array", data: "6BmLlRy5BApReDJNpTR9WgA=" },
    },
    {
      id: "0xafaf4cb2ab65621128c868fc5e4d94",
      address: { __type: "Uint8Array", data: "6K+vTLKrZWIRKMho/F5NlAA=" },
    },
    {
      id: "0xc4266cf766bb02910d19cdb8a215a3",
      address: { __type: "Uint8Array", data: "6MQmbPdmuwKRDRnNuKIVowA=" },
    },
  ],
};

export default store;
