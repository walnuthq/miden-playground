import { formatAssetAmount, parseAssetAmount } from "@miden-sdk/react";
import { FUNGIBLE_FAUCET_DEFAULT_DECIMALS } from "@/lib/constants";

export type FungibleAsset = { faucetId: string; amount: string };

export const formatAmount = ({
  amount,
  decimals = FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
  signDisplay = "auto",
}: {
  amount: string;
  decimals?: number;
  signDisplay?: "auto" | "always" | "never" | "exceptZero";
}) =>
  new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    signDisplay,
  }).format(Number(formatAssetAmount(BigInt(amount), decimals)));

export const parseAmount = (
  amount: string,
  decimals = FUNGIBLE_FAUCET_DEFAULT_DECIMALS,
) => parseAssetAmount(amount, decimals);
