import type { Store } from "@/lib/types/store";
import { defaultStore } from "@/lib/utils/store";

const store: Store = {
  ...defaultStore("mtst"),
  accountCode: [
    {
      root: "0x11c7922301765b70d384d3fa33d0eebfae0947540e003bd028026acdc6473ece",
      code: {
        __type: "Uint8Array",
        data: "Cr8TCrwTTUFTVAAAAAQhUUc3AAAADAAAABIAAAAEAAAAAQAAAAAAAAAOAAAAGgAAAA8AAAAWAAAAIQAAABUAAAALAAAACAAAAAMAAAAdAAAAHgAAAAUAAAATAAAABgAAABkAAAAYAAAABwAAACUAAAAjAAAAIgAAABAAAAAgAAAAJAAAABQAAAAfAAAAGwAAAAkAAAAcAAAAJgAAAMcJW9MzBQevrqBwW6FQU3RqUOJxAAABAAAAAxAAAAkLDSkpKTEBAAAABQAAAAAFCBMBAAAAAgAAAAADEwEAAAABAAAAAAspW+YHGvs8ktTEW8yTcweBD69KAAABAAAABBAAAAkAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAIAAAAAAAAAAgAAAAAAAAAAwHgAAAAAAADAtAAAAAAAAMDkAAAAAAAAwRAAAAAAAADAoAABAAwAAACkAAMAFAAAALgAAQAsAAAAqAACAAAAAACsAAEAEAAAAMQAAAAwAAAAyAADACwAAACwAAIACAAAAJwAAwAUAAAA1AAAADQAAADYAAMAMAAAANaDOM6VSKDDK/JSVCNtRdY9MCsmRkm6HqKOFdQnkcAK2kw4ZWNQmCvHup9BQd1EedE4MXic/peIZq5hSPGdBB1SlYyf5Lmgybvp6/B46/cSnDg0yKcLeB6lAjwBH9ngHhw7yufirg6JNfsuQYiqwuL74BPJgJ1VmB1cxqyI3PwpMBEMx5TuOc/QcD8O3BiqunR+7qZL6tvdxK05X66LwCgjE+mAnUP2HLRROxbbdCoRYb6hBuMtAIB5ACpm2i1UP10FreYpwqrvKUQw80PSLo1RztddtwwI3UVfG9WP//BXXz9RlC5NxX75KDm42CJflJQZ9fLyhcOzMs0+fGkRvLsiLBUAQARAeCQJgL78O/SJVntHQC3dDLprkqIXb+Kwye5t6o+kkEuPI3VPIi/Ri5vLgTjr79KBMR0LhMa+hoDQSTr8RvzvAmcnRWLu8ZQIkri5oU/WyR9dvh8cj6oFaQhN2XwfQfW0WeMHmRgwJVZT+6H8arsCpiHz1DNEGSQdG4dzBCnVIpd4EqEvXlIZ5uDXh8QvyqaxNRXxKs3KByEiMGBgr/Y5+QW+MVRKK2gP1RdUF3WOaUoUKtbbOSGy4S7rf7znV+gKmJlOW6+eKEAgSEBya5BV7QsR8VTjJ/6NYnNKFTYb+n7cM51ubejC5zLJD73hY5kEZk23VE30PQlyNhRT7ZNfunx/TMqMAqgnYFX4ykM9EuT9Da7Hv5HMnXxqARkHuVzRCJ5sNzQiFDBVANDt2yNyr613cjKd7xZZhwlt+mMQ9vqmi0PsUPh6iCNMYJzYzPIOY0H7P+fAscmYc4nAGGJZkah9+8dFm1Djm8NzUPqaMOoPMchAqEId4eIMNPV5/EEzgMN6awNLxZu1DaST+9yQqZxxBK2Xrzsp+iEH1j9k6Qh/1W38keV9WSzsFsJd22LaTNvK52dyNmIa9li/hTW1HzDdB8jxPsIXHSz0lPbJ2F9cR0T83pBbJkcBHXFbBn3F1J7DCfxFTxuyLqXMBfAlSJpteONje67mUJ2Qbeciux+wpggyQfrXAUTS30Cz2nn5zpbfc0JyAOpXyYee90fruXbOwq+S7Z7FT+8puzj5Fa4Pv+YaX8h9qlzMOTIwR0QnYeM2yu8418D8XCY79hHbhhR9mfE4rSZSYegWOk8EQdKRvFcfklz/rXpX6UXYl+dYqvC1zNZi845xwbV9KoPaitWrdm8ftY+CAjQsK4aDOZ0G/xpyRtYxxqAffI31RXr0dtb/5rlatg7yj1lUL/6oCZUfzwlzt7OWvRwGWo/8uFMrhin1owgyM94CTxljMoVIBE1J1gc5CgrDEm3oM8oDmZlmijm4O8h9Ygf4HcwrDBinO9ugaI6MsvoByMgb8c5bAtGXINIPeeaPCGwzeISrDR48xJsTSQX2+l6aV1tvm9dh/3zgmlFz4fA2Ijlm6FRnD1DZ1cdekb8LguU1HCZbE8a46pEmAVSREeh31s0eLTe5x1SchgT0R28+dkKlc/51cnPOw/fxKSQGM6ixa61ERbXY1TEsE4u/dQRs/pAGhJK6fSTlo60NSTKfUn/rCsCisZyrQ86YPdN/87hDcN8WBROOLzMvcjDKRNFiEEx9xQHv/mXZhUAlH5Kk+Wxu9gA6goLP32/h+Wletzo0pDGZxji8LkoSrUPvu/kXPZSgZNaENnmoBvNN+1z9lDzjNDvmH4Lxy0mpeRvp0j+NiMWp74HT7Ag6ccYPz6U4hVa22gVrsYDR92g/ZkgVsZt4ijGEJWKAU2B+a3fG3/IyJlpMVrLKabUXrvkjOfao/CWbLU0ZFlYfp3zeYlFcR9wiRfgB8aeiMnJZrcpUEZOFGMMIXHCVPY+Mi6cVu/j2RNw+PjvcJWKAD4gkQuNc7C9AZ/LczahrXB760xut1VVQSiLZ7pbblRwxh9R5DqURNd9DAsrlbewNEbTBbKSdLrWQmrVXXbx98Wtriore9acj+MQvLrVRwBOR8lu50MPbwOEx2ViD0hlIr0LyU881YPPZh5YA63/MkpUybSeO6rTS9n9srUM2cCfSdPjsgDp5W/3yiGrTPzhagjQxFLWShn2yfFWVVi3HcGK7JF8MEuiBX3jC7pRSU5QxrqCJQV3/9x3oKVkfeoq2EpKAcBXq0tybsVUNnmA0Xf5prbjeM8RU4Tdr9/Xz091Q8Dmli8dec9/ZYHupGmf0bkGxdkqhXmUolPSKIkcw5BN/CkpWq85DjB2/15nc9Wt5zu5B1GzFySZ2m/tbjvsfzNs/sWJEZ7ljJ1V+HGgBWl7s0iXC+chAcxl0Ru3P5EOWQSCkmMqg9nAZRAdDnrrHZaQITEBnds1Kqru8p5tXiW8YuY0fveOBQ6KAIYRVRn8FEDvbybZS2MpKk1V8Koc00UXd1ZQESIgog73jgUOigCGEVUZ/BRA728m2UtjKSpNVfCqHNNFF3dWUSIgogNaDOM6VSKDDK/JSVCNtRdY9MCsmRkm6HqKOFdQnkcAISIgogtpMOGVjUJgrx7qfQUHdRHnRODF4nP6XiGauYUjxnQQcSIgoghw7yufirg6JNfsuQYiqwuL74BPJgJ1VmB1cxqyI3PwoSIgogTARDMeU7jnP0HA/DtwYqrp0fu6mS+rb3cStOV+ui8AoSIgogCMT6YCdQ/YctFE7Ftt0KhFhvqEG4y0AgHkAKmbaLVQ8SIgog10FreYpwqrvKUQw80PSLo1RztddtwwI3UVfG9WP//BUSIgog18/UZQuTcV++Sg5uNgiX5SUGfXy8oXDszLNPnxpEby4SIgogyIsFQBABEB4JAmAvvw79IlWe0dALd0MumuSohdv4rDISIgoge5t6o+kkEuPI3VPIi/Ri5vLgTjr79KBMR0LhMa+hoDQSIgogE3ZfB9B9bRZ4weZGDAlVlP7ofxquwKmIfPUM0QZJB0YSIgog4dzBCnVIpd4EqEvXlIZ5uDXh8QvyqaxNRXxKs3KByEgSIgogut/vOdX6AqYmU5br54oQCBIQHJrkFXtCxHxVOMn/o1gSIgognNKFTYb+n7cM51ubejC5zLJD73hY5kEZk23VE30PQlwSIgogjYUU+2TX7p8f0zKjAKoJ2BV+MpDPRLk/Q2ux7+RzJ18SIgogwlt+mMQ9vqmi0PsUPh6iCNMYJzYzPIOY0H7P+fAscmYSIgogHOJwBhiWZGoffvHRZtQ45vDc1D6mjDqDzHIQKhCHeHgSIgoggw09Xn8QTOAw3prA0vFm7UNpJP73JCpnHEErZevOyn4SIgogiEH1j9k6Qh/1W38keV9WSzsFsJd22LaTNvK52dyNmIYSIgogvZYv4U1tR8w3QfI8T7CFx0s9JT2ydhfXEdE/N6QWyZESIgogJ2Qbeciux+wpggyQfrXAUTS30Cz2nn5zpbfc0JyAOpUSIgog8mHnvdH67l2zsKvku2exU/vKbs4+RWuD7/mGl/IfapcSIgogMw5MjBHRCdh4zbK7zjXwPxcJjv2EduGFH2Z8TitJlJgSIgogegWOk8EQdKRvFcfklz/rXpX6UXYl+dYqvC1zNZi845wSIgogcG1fSqD2orVq3ZvH7WPggI0LCuGgzmdBv8ackbWMcagSIgogB98jfVFevR21v/muVq2DvKPWVQv/qgJlR/PCXO3s5a8SIgogRwGWo/8uFMrhin1owgyM94CTxljMoVIBE1J1gc5CgrASIgogxJt6DPKA5mZZoo5uDvIfWIH+B3MKwwYpzvboGiOjLL4SIgoggHIyBvxzlsC0Zcg0g955o8IbDN4hKsNHjzEmxNJBfb4SIgogl6aV1tvm9dh/3zgmlFz4fA2Ijlm6FRnD1DZ1cdekb8ISIgog4LlNRwmWxPGuOqRJgFUkRHod9bNHi03ucdUnIYE9EdsSIgogz52QqVz/nVyc87D9/EpJAYzqLFrrURFtdjVMSwTi790SIgogQRs/pAGhJK6fSTlo60NSTKfUn/rCsCisZyrQ86YPdN8SIgog/O4Q3DfFgUTji8zL3IwykTRYhBMfcUB7/5l2YVAJR+QSIgogqT5bG72ADqCgs/fb+H5aV63OjSkMZnGOLwuShKtQ++4=",
      },
    },
  ],
  latestAccountStorage: [
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::auth::singlesig::pub_key",
      slotValue:
        "0x35f5520410a643ff119e57a7e2c71390ad25b0fe5833fe4837ddda9dc65add9d",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::auth::singlesig::scheme",
      slotValue:
        "0x0200000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::external_link_0",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::external_link_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::external_link_2",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::external_link_3",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::external_link_4",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::external_link_5",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::external_link_6",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::fungible::token_config",
      slotValue:
        "0x000000000000000000008a5d7845630106000000000000002141030000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::logo_uri_0",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::logo_uri_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::logo_uri_2",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::logo_uri_3",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::logo_uri_4",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::logo_uri_5",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::logo_uri_6",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::mutability_config",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_burn_policy_proc_root",
      slotValue:
        "0x706d5f4aa0f6a2b56add9bc7ed63e0808d0b0ae1a0ce6741bfc69c91b58c71a8",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_mint_policy_proc_root",
      slotValue:
        "0x7b9b7aa3e92412e3c8dd53c88bf462e6f2e04e3afbf4a04c4742e131afa1a034",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_receive_policy_proc_root",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::active_send_policy_proc_root",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_burn_policy_proc_roots",
      slotValue:
        "0x99be6a3dc7233a8ace40e5bb7a553489bcfc4568f62d1ea9134fdbba89bf6d8f",
      slotType: 1,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_mint_policy_proc_roots",
      slotValue:
        "0xd8da92b7e364fbfa344279ad591f5d7e8d527693e0cd89eb7aeed63f9f15fe3e",
      slotType: 1,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_receive_policy_proc_roots",
      slotValue:
        "0x2d2a45733b612b370c67837c9e92262316d7ef884d02a624418fee262203da9a",
      slotType: 1,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_send_policy_proc_roots",
      slotValue:
        "0x2d2a45733b612b370c67837c9e92262316d7ef884d02a624418fee262203da9a",
      slotType: 1,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_description_0",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_description_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_description_2",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_description_3",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_description_4",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_description_5",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_description_6",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_name_0",
      slotValue:
        "0x034d444e00000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::faucets::token_name_1",
      slotValue:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      slotType: 0,
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName: "miden::standards::inspection::storage_schema::commitment",
      slotValue:
        "0x0f5c203f2b0bba623df8ead5f75523d6ae3dfb4806cc560806f972f8b4c3dbc4",
      slotType: 0,
    },
  ],
  latestStorageMapEntries: [
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_burn_policy_proc_roots",
      key: "0x706d5f4aa0f6a2b56add9bc7ed63e0808d0b0ae1a0ce6741bfc69c91b58c71a8",
      value:
        "0x0100000000000000000000000000000000000000000000000000000000000000",
    },
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      slotName:
        "miden::standards::faucets::policies::policy_manager::allowed_mint_policy_proc_roots",
      key: "0x7b9b7aa3e92412e3c8dd53c88bf462e6f2e04e3afbf4a04c4742e131afa1a034",
      value:
        "0x0100000000000000000000000000000000000000000000000000000000000000",
    },
  ],
  latestAccountAssets: [
    {
      accountId: "0xa297e1241c1fedd1456b7d4f3671be",
      vaultKey:
        "0x00000000000000000000000000000000113664ae4d228274310a5fe7ffcabd4c",
      asset:
        "0x9926000000000000000000000000000000000000000000000000000000000000",
    },
  ],
  accountAuth: [
    {
      pubKeyCommitmentHex:
        "0x35f5520410a643ff119e57a7e2c71390ad25b0fe5833fe4837ddda9dc65add9d",
      secretKeyHex:
        "025907ff05ffefc31020fff42fbbf8703a0fdf83fbefc30c41f5002043f77ffdfc2fc00c30c3002f810030c3e380000020c8005e7cebf03d0bf182fc31fe07b0fefbd1841c3084f40dfd03b145fc4086f820c5ffcf7effdd05003dc1e03f02045007fc6efbf8103df3f0c5ebe002043e770c6e7a0c2f7f03cebf043f82fff07f04503d0bbfbd086f39f4603ce80f42fc207e085147f8207c1cad751fdff40c4140ec1f02f430bc004f421b8fc3e46f010420800040011c00c3040079eff0830fd3011400fa040f830831c00b913a241000e42f81f7bebe087083ec103b1c413feb7ffe142fc5f42f7e182f3614504b043fc5fc2fc013e0c3002ffe07ffc403f085fc2f80f800401be0fef7fffbf00fbcec2e85101f3f0c2188101f7f047fbc040105fbdebc0c303f047f3e0be03f0c3f7ffc50fbfc4fbaffd187145109140fbd180001e811f80c10431010fefc0ffc040efc2bf0020f81c02c3108efd000f0d0c2fbd002042ffe101042e7d1361c50bcf8aec1fc6ec2effffa0bdfc80fd1bcec0fb70c0f470fffbffc1d8413f180045f7ef3f1020f8e81085f7fefbffefc4fbd0412c2fbdfc303d0051c0fc1f4703de8103ce020ff081fc0ffdebe0830010420c0e7cffaec117ff3d101241ebd0850b6f7a04007e107f850c607edffec007fec2d83ec2e4107a0420c2080f7d184e8207f105f40e7b08113df40081f80087f7e204fc2fc20420061790bd18a0802020420bfffbec4e8204507d1f9040fbc0ff20003df7b13b03f0c0000fc0f7c0c1100f8a0001fa1021020bc041001f3a080f80002fc21bc0c0f87fc2f7eec2081efa13a03f1c4ec708510303df02e3bf7efbdf001340fd039000041fbeef91bf03bf8100303dffbfbe03d0fe2010fd144f77e3f1850bde44176139140084f40048f4203edc50b9081fbb142f85dc3f87f4300003efbef83000dff0be17d1befc11be0c0efd0460ff03c100ec7fc2fffefcec3e7df3efba1fef48000102f46f3b202f45fc0143fbff001fbf02f01045102f0b1cb07be83ffe17ff050c41bf27c03f045f81ffe03bf06087f78fc10000c3041fbc13a1bd6e8e938ea24f4f310b915f205fcfc05de1df81bc3f13000e205fcf7202a060dc8dae52bfed71fe608de1bfbfa2c3eff01f0fce4d80b2cfffb2fd12ffbe12d4bcd15093cece4c6e50505120e0318fc0dd7171233f6e8e6f403c9412f0acff7ebf012ee04ec0d340afd10effdfbdd04ef23f611faedf0fe341ff9ebf807f5d7eedcf2d713092d542a100932eb19fafae42409e0181af7f6ee0a15f6e414132c0dfb20f5dbdfd2f9d531082d0df0e0d41408fdfb311b2ffe02fefc271be91809ea07080c31f3ee15fbfffe0efaf82afb20220518edfd2726dd3debf1eee3e91412d6062825da0104fc145104d60c1bf6f9cc23f2f4edf70951cc07feefc228fcffcbfb1c0d02fce1f3210d1f0821f4f90cf301eaf9f0133747a5d4072537ebf619210317f90604bce1df21e51825fcf5cdefe3040cefe1e9211d0fe9dd17cf06f50a2816e0dc0af2e3cb01ddcdf802fc1302e3102109020ff6e31fede52208e210fee1e2ea131c1909e1faf1fafbf708f90bf6f1da0c0dd80c0c09f918f8f829c9220a21fff3d112d72ae5d8f81d0b02e0f104fce82022ffc9cbda0700010a2ff0ff0af4fdef1aeef7f419d5250ef93ffff23b1a0dc3e81931d21003dceb0d0f27f4fa18eee02c00020d06e6eaccf0e80601201901df3a200a1efb0e110824f5f1eef1e5e7f9fed60d4118330f340bf0e0f400081eeb0febe0eafff3373d05e8",
    },
  ],
  accountKeyMapping: [
    {
      accountIdHex: "0xa297e1241c1fedd1456b7d4f3671be",
      pubKeyCommitmentHex:
        "0x35f5520410a643ff119e57a7e2c71390ad25b0fe5833fe4837ddda9dc65add9d",
    },
  ],
  latestAccountHeaders: [
    {
      id: "0xa297e1241c1fedd1456b7d4f3671be",
      codeRoot:
        "0x11c7922301765b70d384d3fa33d0eebfae0947540e003bd028026acdc6473ece",
      storageRoot:
        "0x732685f7ad5a56ae39d5588aa14663353be3349387d470e5b58d0d3b03bba0e9",
      vaultRoot:
        "0xf147fff63fce38b8f2d403bbfd814041449f7da68d23f5011a415213b41ba6f5",
      nonce: "1",
      committed: true,
      accountCommitment:
        "0xcf00b50076e4e46b8bb43273a58981290ea4a512d42e8d979aec9a942cff8e04",
      locked: false,
      watched: false,
    },
  ],
  addresses: [
    {
      id: "0xa297e1241c1fedd1456b7d4f3671be",
      address: { __type: "Uint8Array", data: "6KKX4SQcH+3RRWt9TzZxvgA=" },
    },
  ],
};

export default store;
