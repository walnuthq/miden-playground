// A base-unit amount as a number, for APIs that take one (Bread Wallet's
// adapter). Amounts are u64: above 2^53 - 1 a number would round them, so
// those are refused rather than sent wrong.
export const toSafeNumber = (amount: bigint) => {
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      "This amount is too large to send through Bread Wallet from the Playground.",
    );
  }
  return Number(amount);
};
