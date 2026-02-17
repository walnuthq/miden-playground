export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const EMPTY_WORD =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const FUNGIBLE_FAUCET_DEFAULT_DECIMALS = 6;
export const FUNGIBLE_FAUCET_DEFAULT_MAX_SUPPLY = 100_000_000_000n;
export const FUNGIBLE_FAUCET_CODE =
  "0x44ca76648f7067a0378050f87c7f2d7693d92d1cd8de30db34f0779e287cb47f";

export const NO_AUTH_PROC_HASH =
  "0x00498108f0eae0e35deadd489892062338c3d55772635d0b133f0bdf2980bf64";

export const P2ID_NOTE_CODE =
  "0xa657a127211172b9b305d06c6e076dd1edbf67c8b1a32c063647d5f7bf456131";
export const P2IDE_NOTE_CODE =
  "0x3ce934e7d4d1560cedb4d49609062c06071b72bb7914a2791a04eccc10505cbe";

export const BASIC_WALLET_CODE =
  "0xb93e83e1a6f12d6a156b05d5bd010067ff65d5e7677d9a242d6eaeaabfc16918";

export const MIDEN_TESTNET_RPC_URL = "https://rpc.testnet.miden.io";
export const MIDEN_DEVNET_RPC_URL = "https://rpc.devnet.miden.io";
export const MIDEN_LOCAL_RPC_URL = "http://localhost:57291";
export const MIDEN_RPC_URL = MIDEN_TESTNET_RPC_URL;
export const MIDEN_NOTE_TRANSPORT_URL = "https://transport.miden.io";
export const MIDEN_TESTNET_EXPLORER_URL = "https://testnet.midenscan.com";
export const MIDEN_DEVNET_EXPLORER_URL = "https://devnet.midenscan.com";
export const MIDEN_EXPLORER_URL = MIDEN_TESTNET_EXPLORER_URL;
export const MIDEN_FAUCET_API_URL = "https://faucet-api.testnet.miden.io";
export const MIDEN_FAUCET_ACCOUNT_ID = "0x37d5977a8e16d8205a360820f0230f";
export const MIDEN_FAUCET_ADDRESS =
  "mtst1aqmat9m63ctdsgz6xcyzpuprpulwk9vg_qruqqypuyph";

export const TEST_WALLET_ACCOUNT_ID = "0xfa5121fe1d484b10698bae223fbc94";
export const TEST_WALLET_ACCOUNT_ID_PREFIX = 18037235357892234000n;
export const TEST_WALLET_ACCOUNT_ID_SUFFIX = 7605363857866658816n;
export const TEST_WALLET_ADDRESS =
  "mtst1ara9zg07r4yykyrf3whzy0aujsdjugmy_qruqqypuyph";

export const COUNTER_CONTRACT_ACCOUNT_ID = "0x5ad4594a904974000fc69245a29fc3";
export const COUNTER_CONTRACT_ADDRESS =
  "mtst1apddgk22jpyhgqq0c6fytg5lcvwrrej5_qruqqypuyph";
export const COUNTER_CONTRACT_GET_COUNT_PROC_HASH =
  "0x7c79674b4ff38808f0f398222674e7cb4e32315eb6bd01f46b65a82cb80dc66e";
export const COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH =
  "0xfab6fc0c032206c376f4c51405443c973c3fce27784149bf4dbfcf434e534052";
export const COUNT_READER_COPY_COUNT_PROC_HASH =
  "0xe37ab919bc9af46da35dc6c55ac68d5009756a2c6f517f4bb6a575d9067af4ed";
