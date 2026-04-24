import type { NetworkId } from "@/lib/types/network";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const EMPTY_WORD =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const FUNGIBLE_FAUCET_DEFAULT_DECIMALS = 6;
export const FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY = 100_000_000_000n;
export const FUNGIBLE_FAUCET_CODE =
  "0xa40162aa502c0759dfabb341f0244d7e9aa1f7e04400a06c4c1f6314ed57289e";

export const P2ID_NOTE_CODE =
  "0x28bec4edb41a93f2abd3977cafcb4f3a1de8cbb353671e7fda021f41f145f732";
export const P2IDE_NOTE_CODE =
  "0xe32225e1fc4aa2b531e400922ef0f57349cefe195c5f74c7f736dad2aba02875";

export const BASIC_WALLET_CODE =
  "0x0bad1f4a00c7989a3b54f4fcbca767b9f724c7f251ed13a4c1785e2b1a0220bf";

export const GUARDIAN_WALLET_CODE =
  "0x31cffd84377197f286187f0babd8496848c6711e891db24827ed4102f9f50f57";

export const TESTNET_RPC_URL = "https://rpc.testnet.miden.io";
export const DEVNET_RPC_URL = "https://rpc.devnet.miden.io";
export const LOCAL_RPC_URL = "http://localhost:57291";
export const TESTNET_NOTE_TRANSPORT_URL = "https://transport.miden.io";
export const DEVNET_NOTE_TRANSPORT_URL = "https://transport.devnet.miden.io";
export const TESTNET_EXPLORER_URL = "https://testnet.midenscan.com";
export const DEVNET_EXPLORER_URL = "https://devnet.midenscan.com";
export const GUARDIAN_ENDPOINT_URL =
  process.env.NEXT_PUBLIC_GUARDIAN_ENDPOINT_URL ?? "http://localhost:3002";

export const TESTNET_FAUCET_API_URL = "https://faucet-api.testnet.miden.io";
export const DEVNET_FAUCET_API_URL =
  "https://faucet-api-devnet-miden.eu-central-8.gateway.fm";
export const TESTNET_FAUCET_ACCOUNT_ID = "0x0a7d175ed63ec5200fb2ced86f6aa5";
export const DEVNET_FAUCET_ACCOUNT_ID = "0x16f6c85d5652c9200879145bfdda93";
export const TESTNET_FAUCET_ADDRESS =
  "mtst1aq9869676clv2gq0kt8dsmm255zs6hs3_qr7qqq9wr6w";
export const DEVNET_FAUCET_ADDRESS =
  "mdev1aqt0djza2efvjgqg0y29hlw6jvn93r0a_qr7qqq9wr6w";

export const TESTNET_TEST_WALLET_ACCOUNT_ID =
  "0x99d6740616be36105b9eadecefdb67";
export const DEVNET_TEST_WALLET_ACCOUNT_ID = "0x09530c96f7d1e910418ef59b902e78";
export const TESTNET_TEST_WALLET_ACCOUNT_ID_PREFIX = 11085175102319244816n;
export const DEVNET_TEST_WALLET_ACCOUNT_ID_PREFIX = 671894611950692624n;
export const TESTNET_TEST_WALLET_ACCOUNT_ID_SUFFIX = 6601905336919746304n;
export const DEVNET_TEST_WALLET_ACCOUNT_ID_SUFFIX = 4723983107645929472n;
export const TESTNET_TEST_WALLET_ADDRESS =
  "mtst1azvavaqxz6lrvyzmn6k7em7mvuzlf0vl_qr7qqq9wr6w";
export const DEVNET_TEST_WALLET_ADDRESS =
  "mdev1aqy4xryk7lg7jyzp3m6ehypw0q7frd3g_qr7qqq9wr6w";

export const TESTNET_COUNTER_CONTRACT_ACCOUNT_ID =
  "0xf46483e37a0e13006ade581295aed5";
export const DEVNET_COUNTER_CONTRACT_ACCOUNT_ID =
  "0x67e2f741c3ce5c00551578346e06e2";
export const TESTNET_COUNTER_CONTRACT_ADDRESS =
  "mtst1ar6xfqlr0g8pxqr2mevp99dw65ukvm3j_qr7qqq9wr6w";
export const DEVNET_COUNTER_CONTRACT_ADDRESS =
  "mdev1apn79a6pc089cqz4z4urgmsxugy0krfv_qr7qqq9wr6w";
export const COUNTER_CONTRACT_GET_COUNT_PROC_HASH =
  "0xcc2d9b042278ba027b18d5aaef4b886ad76ce9bf3f94746811f1c731ab5c5983";
export const COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH =
  "0x4bac397fc077a1bc17c8fd6f911419ee095d649cea4218fde7b5c085dc1bc0de";
export const COUNT_READER_COPY_COUNT_PROC_HASH =
  "0xe37ab919bc9af46da35dc6c55ac68d5009756a2c6f517f4bb6a575d9067af4ed";

export const midenExplorerUrl = (networkId: NetworkId) =>
  networkId === "mtst" ? TESTNET_EXPLORER_URL : DEVNET_EXPLORER_URL;

export const midenFaucetAccountId = (networkId: NetworkId) =>
  networkId === "mtst" ? TESTNET_FAUCET_ACCOUNT_ID : DEVNET_FAUCET_ACCOUNT_ID;

export const midenFaucetAddress = (networkId: NetworkId) =>
  networkId === "mtst" ? TESTNET_FAUCET_ADDRESS : DEVNET_FAUCET_ADDRESS;

export const midenFaucetApiUrl = (networkId: NetworkId) =>
  networkId === "mtst" ? TESTNET_FAUCET_API_URL : DEVNET_FAUCET_API_URL;

export const testWalletAccountId = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_TEST_WALLET_ACCOUNT_ID
    : DEVNET_TEST_WALLET_ACCOUNT_ID;

export const testWalletAccountIdPrefix = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_TEST_WALLET_ACCOUNT_ID_PREFIX
    : DEVNET_TEST_WALLET_ACCOUNT_ID_PREFIX;

export const testWalletAccountIdSuffix = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_TEST_WALLET_ACCOUNT_ID_SUFFIX
    : DEVNET_TEST_WALLET_ACCOUNT_ID_SUFFIX;

export const testWalletAddress = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_TEST_WALLET_ADDRESS
    : DEVNET_TEST_WALLET_ADDRESS;

export const counterContractAccountId = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_COUNTER_CONTRACT_ACCOUNT_ID
    : DEVNET_COUNTER_CONTRACT_ACCOUNT_ID;

export const counterContractAddress = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_COUNTER_CONTRACT_ADDRESS
    : DEVNET_COUNTER_CONTRACT_ADDRESS;
