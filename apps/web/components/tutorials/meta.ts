import type { TutorialId, TutorialMeta } from "@/lib/types/tutorial";

// What the home page's cards and the project switcher show of each tutorial,
// apart from its steps and state. On its own so the app shell can render them
// before the SDK loads: the step components import the SDK, so the full
// tutorials (index.ts) can't be in the shell's graph. Each tutorial's index.ts
// spreads its entry here; index.ts checks `stepCount` against the steps in
// dev. A new tutorial gets its entry here first.
export const tutorialMetas: TutorialMeta[] = [
  {
    id: "create-and-fund-wallet",
    number: 1,
    title: "Create and fund a wallet",
    tagline: "Create a new wallet and fund it using a faucet.",
    description:
      "In this first tutorial, you'll create a new wallet and learn how to fund it by creating your first Miden Transactions.",
    category: "beginner",
    initialRoute: "/accounts",
    stepCount: 6,
    requiresWallet: false,
  },
  {
    id: "transfer-assets-between-wallets",
    number: 2,
    title: "Transfer assets between wallets",
    tagline: "Transfer tokens between two wallets.",
    description:
      "In this tutorial, you'll learn how to transfer assets from one wallet to another.",
    category: "beginner",
    initialRoute: "/accounts",
    stepCount: 5,
    requiresWallet: false,
  },
  {
    id: "connect-wallet-and-sign-transactions",
    number: 3,
    title: "Connect a wallet and sign transactions",
    tagline: "Connect your Bread Wallet and sign transactions on testnet.",
    description:
      "In this tutorial, you'll connect your Bread Wallet to the Miden Playground and sign transactions on Miden testnet.",
    category: "beginner",
    initialRoute: "/accounts",
    stepCount: 5,
    requiresWallet: true,
  },
  {
    id: "private-transfers",
    number: 4,
    title: "Private transfers",
    tagline: "Send assets privately from Bread Wallet to Para Wallet.",
    description:
      "In this tutorial, you'll fund a private Bread Wallet and send assets in a private note to a public Para Wallet on Miden testnet.",
    category: "beginner",
    initialRoute: "/accounts",
    stepCount: 6,
    requiresWallet: true,
  },
  {
    id: "wallet-backup-using-miden-guardian",
    number: 5,
    title: "Wallet backup using Miden Guardian",
    tagline: "Back up your private wallet with Miden Guardian.",
    description:
      "In this tutorial, you'll back up and restore a private wallet with Miden Guardian, an off-chain service that backs up and syncs private account state across devices without being able to move your funds.",
    category: "advanced",
    initialRoute: "/accounts",
    stepCount: 7,
    requiresWallet: true,
  },
  {
    id: "interact-with-the-counter-contract",
    number: 6,
    title: "Interact with the counter contract",
    tagline: "Increment a counter contract deployed on testnet.",
    description:
      "In this tutorial, you'll read the code of a counter contract deployed on testnet, import it into the Playground and increment its counter.",
    category: "beginner",
    initialRoute: "/scripts",
    stepCount: 6,
    requiresWallet: false,
  },
  {
    id: "deploy-a-counter-contract",
    number: 7,
    title: "Deploy a counter contract",
    tagline: "Deploy your own counter contract on testnet.",
    description:
      "In this tutorial, you'll customize a counter contract, deploy it on testnet and increment its counter.",
    category: "advanced",
    initialRoute: "/scripts",
    stepCount: 7,
    requiresWallet: false,
  },
  {
    id: "timelock-p2id-note",
    number: 8,
    title: "Timelock P2ID note",
    tagline: "Create your own timelocked P2ID note.",
    description:
      "In this tutorial, you'll write a timelocked P2ID note script and create a Note that its target account can only consume once a given block height is reached.",
    category: "advanced",
    initialRoute: "/scripts",
    stepCount: 5,
    requiresWallet: true,
  },
  {
    id: "network-transactions",
    number: 9,
    title: "Network transactions",
    tagline: "Deploy a network counter and increment it with a network note.",
    description:
      "In this tutorial, you'll deploy a network counter contract on testnet and increment it with a network note, consumed by the network transaction builder.",
    category: "advanced",
    initialRoute: "/accounts",
    stepCount: 5,
    requiresWallet: true,
  },
  {
    id: "foreign-procedure-invocation",
    number: 10,
    title: "Foreign procedure invocation",
    tagline:
      "Copy a counter contract's count with a read-only cross-contract call.",
    description:
      "In this tutorial, you'll deploy a Count Reader contract on testnet that reads the count of a counter contract with foreign procedure invocation (FPI) and copies it to its own storage.",
    category: "advanced",
    initialRoute: "/scripts",
    stepCount: 6,
    requiresWallet: false,
  },
  {
    id: "your-first-smart-contract-and-custom-note",
    number: 11,
    title: "Your first smart contract and custom note",
    tagline: "Write a counter contract and a custom note to increment it.",
    description:
      "In this tutorial, you'll write a counter contract and a custom note script, deploy the contract on testnet and increment its counter with a custom note.",
    category: "advanced",
    initialRoute: "/scripts",
    stepCount: 8,
    requiresWallet: true,
  },
  {
    id: "contract-verification",
    number: 12,
    title: "Contract verification",
    tagline: "Verify a contract's source code so anyone can interact with it.",
    description:
      "In this tutorial, you'll extend a counter contract, deploy it on testnet, and verify an unverified copy of it by uploading its source code to the Playground.",
    category: "advanced",
    initialRoute: "/scripts",
    stepCount: 7,
    requiresWallet: false,
  },
];

export const tutorialMeta = (id: Exclude<TutorialId, "">): TutorialMeta => {
  const meta = tutorialMetas.find((meta) => meta.id === id);
  if (!meta) {
    throw new Error(`No entry for tutorial "${id}" in tutorials/meta.ts`);
  }
  return meta;
};
