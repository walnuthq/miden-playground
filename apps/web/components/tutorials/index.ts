import tutorial1 from "@/components/tutorials/create-and-fund-wallet";
import tutorial2 from "@/components/tutorials/transfer-assets-between-wallets";
import tutorial3 from "@/components/tutorials/connect-wallet-and-sign-transactions";
import tutorial4 from "@/components/tutorials/private-transfers";
import tutorial5 from "@/components/tutorials/wallet-backup-using-miden-guardian";
import tutorial6 from "@/components/tutorials/interact-with-the-counter-contract";
import tutorial7 from "@/components/tutorials/deploy-a-counter-contract";
import tutorial8 from "@/components/tutorials/timelock-p2id-note";
import tutorial9 from "@/components/tutorials/network-transactions";
import tutorial10 from "@/components/tutorials/foreign-procedure-invocation";
import tutorial11 from "@/components/tutorials/your-first-smart-contract-and-custom-note";
import tutorial12 from "@/components/tutorials/contract-verification";

if (
  typeof window !== "undefined" &&
  new URL(window.location.href).searchParams.get("preview-tutorials") === "true"
) {
  localStorage.setItem("preview-tutorials", "true");
}

const tutorials = [
  tutorial1,
  tutorial2,
  tutorial3,
  tutorial4,
  tutorial5,
  tutorial6,
  tutorial7,
  tutorial8,
  tutorial9,
  tutorial10,
  tutorial11,
  tutorial12,
];

if (
  typeof window !== "undefined" &&
  localStorage.getItem("preview-tutorials") === "true"
) {
  // tutorials.push(tutorial12);
}

export default tutorials;
