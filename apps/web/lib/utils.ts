import { formatUnits, parseUnits } from "viem";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatId = (id: string) => `${id.slice(0, 10)}…${id.slice(-8)}`;

export const formatValue = (value: string) =>
  `${value.slice(0, 18)}…${value.slice(-16)}`;

export const formatAddress = (address: string, networkId: string) =>
  `${networkId}${address.slice(networkId.length).slice(0, 8)}…${address.slice(-8)}`;

export const formatAmount = (amount: string, decimals: bigint) =>
  new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: Number(decimals),
  }).format(Number(formatUnits(BigInt(amount), Number(decimals))));

export const parseAmount = (amount: string, decimals: bigint) =>
  parseUnits(amount, Number(decimals));

export const stringToFeltArray = (word: string): BigUint64Array => {
  const [, felt0, felt1, felt2, felt3] = word.match(
    /0x([0-9a-f]{16})([0-9a-f]{16})([0-9a-f]{16})([0-9a-f]{16})/
  )!;
  return new BigUint64Array(
    [felt0!, felt1!, felt2!, felt3!].map((felt) =>
      BigInt(`0x${felt!.match(/../g)!.reverse().join("")}`)
    )
  );
};
