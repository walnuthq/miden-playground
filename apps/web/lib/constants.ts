import type { NetworkId } from "@/lib/types/network";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const EMPTY_WORD =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const FUNGIBLE_FAUCET_DEFAULT_DECIMALS = 6;
export const FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY = 100_000_000_000n;
export const FUNGIBLE_FAUCET_CODE =
  "0x33919b5e023653c50ee83293e71d77f4e687b2d128d7ec5b5c7dfc5918a8da2b";

export const P2ID_NOTE_CODE =
  "0xf08ea78d8d0570b219a40bfc5652c1de5adb2dfdc7ab034622dedae7837ac8ac";
export const P2IDE_NOTE_CODE =
  "0x512ebb716b6664fc054dc22c83708f50d92d75da1159752f5cf3a0e81594a1da";
export const SWAP_NOTE_CODE =
  "0xb3b028d3e69dbf308f780d32ae3980ac28568289903e8f91db47de5b9e01094e";
export const PSWAP_NOTE_CODE =
  "0x55db5f113de3657bcc944401f85eadd270a67f58963507684c7f648a2ba9567a";
export const MINT_NOTE_CODE =
  "0xdc4dcae6fb3adfa8ecde42762d990c600a730b52afdde400aebf49ae2d7deee2";
export const BURN_NOTE_CODE =
  "0x861d8e08672e928179e1aedb1e4ec09bff641ed457025123ffb01d502f5deaeb";

export const BASIC_WALLET_CODE =
  "0x0fcb1b772bfa8087b382175c545972b2fe54091e5f820321337d4d1110929773";

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
export const TESTNET_FAUCET_ACCOUNT_ID = "0x2458e5446128e6b150b75b8ebd9ce1";
export const DEVNET_FAUCET_ACCOUNT_ID = "0x16f6c85d5652c9200879145bfdda93";
export const TESTNET_FAUCET_ADDRESS =
  "mtst1aqj93e2yvy5wdv2skadca0vuuypfnp80_qr7qqq9wr6w";
export const DEVNET_FAUCET_ADDRESS =
  "mdev1aqt0djza2efvjgqg0y29hlw6jvn93r0a_qr7qqq9wr6w";

export const TESTNET_TEST_WALLET_ACCOUNT_ID =
  "0xbd9ff94dabdb72b13b2f3e099dc721";
export const DEVNET_TEST_WALLET_ACCOUNT_ID = "0x09530c96f7d1e910418ef59b902e78";
export const TESTNET_TEST_WALLET_ACCOUNT_ID_PREFIX = 13663913906456457905n;
export const DEVNET_TEST_WALLET_ACCOUNT_ID_PREFIX = 671894611950692624n;
export const TESTNET_TEST_WALLET_ACCOUNT_ID_SUFFIX = 4264695583165849856n;
export const DEVNET_TEST_WALLET_ACCOUNT_ID_SUFFIX = 4723983107645929472n;
export const TESTNET_TEST_WALLET_ADDRESS =
  "mtst1az7el72d40dh9vfm9ulqn8w8yycr4h99_qr7qqq9wr6w";
export const DEVNET_TEST_WALLET_ADDRESS =
  "mdev1aqy4xryk7lg7jyzp3m6ehypw0q7frd3g_qr7qqq9wr6w";

export const TESTNET_COUNTER_CONTRACT_ACCOUNT_ID =
  "0x375fdc8d9d4a6e912e8ef6b3975d6c";
export const DEVNET_COUNTER_CONTRACT_ACCOUNT_ID =
  "0x67e2f741c3ce5c00551578346e06e2";
export const TESTNET_COUNTER_CONTRACT_ADDRESS =
  "mtst1aqm4lhydn49xayfw3mmt896adshf8da9_qr7qqq9wr6w";
export const DEVNET_COUNTER_CONTRACT_ADDRESS =
  "mdev1apn79a6pc089cqz4z4urgmsxugy0krfv_qr7qqq9wr6w";
export const COUNTER_CONTRACT_GET_COUNT_PROC_HASH =
  "0x31c77b5bcebfc55d6bf71e690d6b88beb379a966296c41d1145ec09db53f666c";
export const COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH =
  "0x61d9dfb65b097b16d242dc41c4daa41159791ba0c113652b3f3fc8d5eb1f4224";
export const COUNTER_NOTE_RUN_PROC_HASH =
  "0x1d6a15360e230770d304b4504ebcaca76db5708b1886f5cab114af1089820e7c";
export const COUNTER_SCRIPT_RUN_PROC_HASH =
  "0x43ede503c5e65af0117f6a8e2a0adf269ea3e566a54ce41d86287f4039aa6622";
export const COUNT_READER_COPY_COUNT_PROC_HASH =
  "0xda25b564385a2445b50c101e975f33f9ec116731a4cffff66f3a8f3488d1683a";

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
