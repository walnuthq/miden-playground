import tutorial3 from "@/components/tutorials/connect-wallet-and-sign-transactions";
import tutorial12 from "@/components/tutorials/contract-verification";
import tutorial1 from "@/components/tutorials/create-and-fund-wallet";
import tutorial7 from "@/components/tutorials/deploy-a-counter-contract";
import tutorial10 from "@/components/tutorials/foreign-procedure-invocation";
import tutorial6 from "@/components/tutorials/interact-with-the-counter-contract";
import { tutorialMetas } from "@/components/tutorials/meta";
import tutorial9 from "@/components/tutorials/network-transactions";
import tutorial4 from "@/components/tutorials/private-transfers";
import tutorial8 from "@/components/tutorials/timelock-p2id-note";
import tutorial2 from "@/components/tutorials/transfer-assets-between-wallets";
import tutorial5 from "@/components/tutorials/wallet-backup-using-miden-guardian";
import tutorial11 from "@/components/tutorials/your-first-smart-contract-and-custom-note";
import type { Tutorial } from "@/lib/types/tutorial";

if (
  typeof window !== "undefined" &&
  new URL(window.location.href).searchParams.get("preview-tutorials") === "true"
) {
  localStorage.setItem("preview-tutorials", "true");
}

const tutorials: Tutorial[] = [
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

// The metadata (meta.ts) stands in for the tutorials where the SDK isn't
// loaded yet: keep the two lists in step. Dev only, so it fails fast locally
// and in the e2e runs against the dev server; nothing to catch at build time.
if (import.meta.env.DEV) {
  const ids = tutorialMetas.map(({ id }) => id);
  if (ids.join() !== tutorials.map(({ id }) => id).join()) {
    throw new Error(
      `tutorials/meta.ts lists ${ids.join(", ")}: not the tutorials, in order`,
    );
  }
  for (const { id, stepCount, steps } of tutorials) {
    if (steps.length !== stepCount) {
      throw new Error(
        `tutorials/meta.ts says tutorial "${id}" has ${stepCount} steps, it has ${steps.length}`,
      );
    }
  }
}

if (
  typeof window !== "undefined" &&
  localStorage.getItem("preview-tutorials") === "true"
) {
  // tutorials.push(tutorial12);
}

export default tutorials;
