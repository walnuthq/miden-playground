import type { NetworkId } from "@/lib/types/network";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
export const API_REGISTRY_URL =
  import.meta.env.VITE_API_REGISTRY_URL ?? "http://localhost:8081";

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
// The FEE_SPONSORSHIP note a transaction's fee payment creates alongside each
// note it sends to a network account (`NoteScript.feeSponsorship()`).
export const FEE_SPONSORSHIP_NOTE_CODE =
  "0x595a98a56dc7bc62047b0fd9af7e81805f30e0320c6c0eca044826d34abe595c";
export const TX_FEE_NOTE_CODE =
  "0xc37eff1b503b0eb3630b85744a1f61b80a30f2798f5ab74b502dd4812d493999";

export const BASIC_WALLET_CODE =
  "0xd907718ecd4b88aceef87c6597c9f968cb6d9661d56dc61a68edf4704e0acbaa";

export const GUARDIAN_WALLET_CODE =
  "0x062fa269af71775aaf1231cd543294390c6df661447a0037d236371eb7e9876e";

// Partner Mainnet: invite-only, real funds. The SDK has no "mainnet" shorthand,
// so these are passed as full URLs. No faucet API: accounts are funded from the
// connected Bread Wallet.
export const MAINNET_RPC_URL = "https://rpc.mainnet.miden.io";
export const MAINNET_PROVER_URL = "https://tx-prover.mainnet.miden.io";
export const MAINNET_NOTE_TRANSPORT_URL = "https://transport.mainnet.miden.io";
export const MAINNET_EXPLORER_URL = "https://explorer.mainnet.miden.io";
// What Bread Wallet sends a new mainnet (network) account, in USDCX base units
// (6 decimals): 0.001 USDCX. A fee is `verificationBaseFee` (7 on mainnet as of
// 2026-11) × (⌊log₂(cycles)⌋ + 1): ~126-140 units for the deploy transaction
// consuming this note, which leaves a buffer for a few more. Senders of network
// notes pay for their consumption (`clientNetworkNoteFee`), so the buffer isn't
// drained. Re-check it if the base fee changes.
export const MAINNET_FUNDING_AMOUNT = 1_000;
// The native fee asset (USDCX) faucet.
export const MAINNET_FAUCET_ACCOUNT_ID = "0xe69e6ca6e39df1b10c1e5399399feb";
export const MAINNET_FAUCET_ADDRESS =
  "mm1arnfum9xuwwlrvgvrefejwvlavn3vk24_qr7qqq9wr6w";

export const TESTNET_RPC_URL = "https://rpc.testnet.miden.io";
export const DEVNET_RPC_URL = "https://rpc.devnet.miden.io";
export const LOCAL_RPC_URL = "http://localhost:57291";
export const TESTNET_NOTE_TRANSPORT_URL = "https://transport.miden.io";
export const DEVNET_NOTE_TRANSPORT_URL = "https://transport.devnet.miden.io";
export const TESTNET_EXPLORER_URL = "https://testnet.midenscan.com";
export const DEVNET_EXPLORER_URL = "https://devnet.midenscan.com";
export const GUARDIAN_ENDPOINT_URL =
  import.meta.env.VITE_GUARDIAN_ENDPOINT_URL ?? "http://localhost:3002";

export const TESTNET_FAUCET_API_URL = "https://faucet-api.testnet.miden.io";
export const DEVNET_FAUCET_API_URL = "https://faucet-api.devnet.miden.io";
// The native fee asset (USDCX) faucet, which issues the assets the faucet API hands out.
export const TESTNET_FAUCET_ACCOUNT_ID = "0x4cbdcaffe75f0a317482224dae6436";
export const DEVNET_FAUCET_ACCOUNT_ID = "";
// Since faucet 0.17 the notes are sent by the node's funding service account, a basic
// wallet holding the native asset, not by the asset's faucet.
export const TESTNET_FAUCET_FUNDER_ACCOUNT_ID =
  "0x4e6fb40fd2f6a55140df2c42dfb5b7";
export const DEVNET_FAUCET_FUNDER_ACCOUNT_ID =
  "0x5aaf13b1b151a9517cf4adc0ae65b0";
export const TESTNET_FAUCET_ADDRESS =
  "mtst1apxtmjhlua0s5vt5sg3ymtnyxclasaf0_qr7qqq9wr6w";
export const DEVNET_FAUCET_ADDRESS = "";

export const TESTNET_COUNTER_CONTRACT_ACCOUNT_ID =
  "0x1856bd4ea0182491283f868d0733b2";
export const DEVNET_COUNTER_CONTRACT_ACCOUNT_ID = "";
export const TESTNET_COUNTER_CONTRACT_ADDRESS =
  "mtst1aqv9d02w5qvzfyfg87rg6penkg2fgqyc_qr7qqq9wr6w";
export const DEVNET_COUNTER_CONTRACT_ADDRESS = "";
export const COUNTER_CONTRACT_GET_COUNT_PROC_HASH =
  "0x59d75d32906324e66bc719fe956662cd534c87d03ebda5a81444268f6fae574b";
export const COUNTER_CONTRACT_INCREMENT_COUNT_PROC_HASH =
  "0xf23908cdb67bcb5a335047c1321f62d89582185be3fda38d47d517da4f18ccc9";
export const COUNTER_NOTE_RUN_PROC_HASH =
  "0xb08de5ec2961a2b3c3641d278230c091d46ac37bab78d50a5c140368020ea3cf";
export const COUNTER_SCRIPT_RUN_PROC_HASH =
  "0xb08de5ec2961a2b3c3641d278230c091d46ac37bab78d50a5c140368020ea3cf";

export const midenExplorerUrl = (networkId: NetworkId) =>
  ({
    mm: MAINNET_EXPLORER_URL,
    mtst: TESTNET_EXPLORER_URL,
    mdev: DEVNET_EXPLORER_URL,
    mlcl: DEVNET_EXPLORER_URL,
    mmck: DEVNET_EXPLORER_URL,
  })[networkId];

export const midenFaucetAccountId = (networkId: NetworkId) =>
  ({
    mm: MAINNET_FAUCET_ACCOUNT_ID,
    mtst: TESTNET_FAUCET_ACCOUNT_ID,
    mdev: DEVNET_FAUCET_ACCOUNT_ID,
    mlcl: DEVNET_FAUCET_ACCOUNT_ID,
    mmck: DEVNET_FAUCET_ACCOUNT_ID,
  })[networkId];

// Mainnet has no faucet API and no funding service account.
export const midenFaucetFunderAccountId = (networkId: NetworkId) =>
  ({
    mm: "",
    mtst: TESTNET_FAUCET_FUNDER_ACCOUNT_ID,
    mdev: DEVNET_FAUCET_FUNDER_ACCOUNT_ID,
    mlcl: DEVNET_FAUCET_FUNDER_ACCOUNT_ID,
    mmck: DEVNET_FAUCET_FUNDER_ACCOUNT_ID,
  })[networkId];

export const midenFaucetAddress = (networkId: NetworkId) =>
  ({
    mm: MAINNET_FAUCET_ADDRESS,
    mtst: TESTNET_FAUCET_ADDRESS,
    mdev: DEVNET_FAUCET_ADDRESS,
    mlcl: DEVNET_FAUCET_ADDRESS,
    mmck: DEVNET_FAUCET_ADDRESS,
  })[networkId];

export const midenFaucetApiUrl = (networkId: NetworkId) =>
  ({
    mm: "",
    mtst: TESTNET_FAUCET_API_URL,
    mdev: DEVNET_FAUCET_API_URL,
    mlcl: DEVNET_FAUCET_API_URL,
    mmck: DEVNET_FAUCET_API_URL,
  })[networkId];

// The tutorials' counter contract is deployed on testnet only.
export const counterContractAccountId = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_COUNTER_CONTRACT_ACCOUNT_ID
    : DEVNET_COUNTER_CONTRACT_ACCOUNT_ID;

export const counterContractAddress = (networkId: NetworkId) =>
  networkId === "mtst"
    ? TESTNET_COUNTER_CONTRACT_ADDRESS
    : DEVNET_COUNTER_CONTRACT_ADDRESS;
