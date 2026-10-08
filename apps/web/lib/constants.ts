import type { NetworkId } from "@/lib/types/network";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const API_REGISTRY_URL =
  process.env.NEXT_PUBLIC_API_REGISTRY_URL ?? "http://localhost:8081";

export const EMPTY_WORD =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const FUNGIBLE_FAUCET_DEFAULT_DECIMALS = 6;
export const FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY = 100_000_000_000n;
export const FUNGIBLE_FAUCET_CODE =
  "0x11c7922301765b70d384d3fa33d0eebfae0947540e003bd028026acdc6473ece";

export const P2ID_NOTE_CODE =
  "0xfb8052cf499c8923513fe112e2a4812b005738194759903e1aa6cab3f7334ada";
export const P2IDE_NOTE_CODE =
  "0x775c7e6b99171d8eb3808ea84588bd439ef81016e4cf950c3edafbffc13d0643";
export const SWAP_NOTE_CODE =
  "0x2363589b463de87885a11bebc90dc838785ed80f2bea559d670f103442a3f223";
export const PSWAP_NOTE_CODE =
  "0x8caafbeead87a70f6b95ad35caf01fb33ed84e8b05190af0fbd5f67719323fed";
export const MINT_NOTE_CODE =
  "0xb4c2ff092b6e0aebacd11c290f1cafb72dd53a98e489755f00361a0bba986344";
export const BURN_NOTE_CODE =
  "0x3d951250cb118282a37b8ee9395f3e3b3c30fab4dbe8c6b0093acfeed3ba04af";
export const TX_FEE_NOTE_CODE =
  "0xc37eff1b503b0eb3630b85744a1f61b80a30f2798f5ab74b502dd4812d493999";

export const BASIC_WALLET_CODE =
  "0xd907718ecd4b88aceef87c6597c9f968cb6d9661d56dc61a68edf4704e0acbaa";

export const GUARDIAN_WALLET_CODE =
  "0xda60a759977a07fe0093c99a9f0b185cc91fefa30c408af904909f10cac78053";

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
export const DEVNET_FAUCET_API_URL = "https://faucet-api.devnet.miden.io";
export const TESTNET_FAUCET_ACCOUNT_ID = "0x4e6fb40fd2f6a55140df2c42dfb5b7";
export const DEVNET_FAUCET_ACCOUNT_ID = "";
// Since faucet 0.17 the notes are sent by the node's funding service account.
export const TESTNET_FAUCET_FUNDER_ACCOUNT_ID =
  "0x4e6fb40fd2f6a55140df2c42dfb5b7";
export const DEVNET_FAUCET_FUNDER_ACCOUNT_ID =
  "0x5aaf13b1b151a9517cf4adc0ae65b0";
export const TESTNET_FAUCET_ADDRESS =
  "mtst1ap8xldq06tm2252qmuky9ha4kunjzkhn_qr7qqq9wr6w";
export const DEVNET_FAUCET_ADDRESS = "";

export const TESTNET_TEST_WALLET_ACCOUNT_ID =
  "0x8310ebba55c19a91697ab988d165fa";
export const DEVNET_TEST_WALLET_ACCOUNT_ID = "";
export const TESTNET_TEST_WALLET_ACCOUNT_ID_PREFIX = 9444307604131125905n;
export const DEVNET_TEST_WALLET_ACCOUNT_ID_PREFIX = 0n;
export const TESTNET_TEST_WALLET_ACCOUNT_ID_SUFFIX = 7600591318420945408n;
export const DEVNET_TEST_WALLET_ACCOUNT_ID_SUFFIX = 0n;
export const TESTNET_TEST_WALLET_ADDRESS =
  "mtst1azp3p6a62hqe4ytf02uc35t9lgn6qjdc_qr7qqq9wr6w";
export const DEVNET_TEST_WALLET_ADDRESS = "";

export const TESTNET_COUNTER_CONTRACT_ACCOUNT_ID =
  "0x35e019e378e5c691551856536748f2";
export const DEVNET_COUNTER_CONTRACT_ACCOUNT_ID = "";
export const TESTNET_COUNTER_CONTRACT_ADDRESS =
  "mtst1aq67qx0r0rjudy24rpt9xe6g7gres5mv_qr7qqq9wr6w";
export const DEVNET_COUNTER_CONTRACT_ADDRESS = "";
export const COUNTER_CONTRACT_GET_COUNT_PROC_HASH =
  "0x54aee3c138e8fd78e4697a275fba033f5fca7d2c5f8b219f1567640c2bca974f";
export const COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH =
  "0xf2256e2448a495a4dee021a64fd5661a42df4e8d466eedb4a169eca97901de0c";
export const COUNTER_NOTE_RUN_PROC_HASH =
  "0xbae76663f662e59e3575623d81f2ee15d5228b696e830f18ea975ea66133cdb8";
export const COUNTER_SCRIPT_RUN_PROC_HASH =
  "0xbae76663f662e59e3575623d81f2ee15d5228b696e830f18ea975ea66133cdb8";

export const midenExplorerUrl = (networkId: NetworkId) =>
  networkId === "mtst" ? TESTNET_EXPLORER_URL : DEVNET_EXPLORER_URL;

export const midenFaucetAccountId = (networkId: NetworkId) =>
  networkId === "mtst" ? TESTNET_FAUCET_ACCOUNT_ID : DEVNET_FAUCET_ACCOUNT_ID;

export const midenFaucetFunderAccountId = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_FAUCET_FUNDER_ACCOUNT_ID
    : DEVNET_FAUCET_FUNDER_ACCOUNT_ID;

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
