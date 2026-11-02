import state from "@/lib/examples/miden-bank/state";
import type { Example } from "@/lib/types/example";

const midenBank: Example = {
  id: "bank-account",
  title: "Miden Bank",
  tagline:
    "Deploy a bank contract on testnet, then deposit and withdraw assets.",
  description: (
    <p>
      This example is the companion code of the{" "}
      <strong>Building a Bank with Miden Rust</strong> tutorial in the{" "}
      <a
        className="text-[#ff5500] font-medium underline underline-offset-4"
        href="https://docs.miden.xyz/builder/tutorials/miden-bank"
        target="_blank"
        rel="noreferrer"
      >
        Miden documentation
      </a>
      . Initialize the bank with the <code>init-tx-script</code> transaction
      script before making deposits.
    </p>
  ),
  state,
};

export default midenBank;
