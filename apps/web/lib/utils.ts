import { ZERO_ACCOUNT_ID } from "@/lib/constants";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatId = (id: string) => `${id.slice(0, 10)}…${id.slice(-8)}`;

export const formatValue = (value: string) =>
  `${value.slice(0, 18)}…${value.slice(-16)}`;

export const formatAddress = (address: string, networkId: string) =>
  `${networkId}${address.slice(networkId.length).slice(0, 8)}…${address.slice(-8)}`;

export const noteInputsToAccountId = (noteInputs: bigint[]) => {
  const [suffix, prefix] = noteInputs;
  if (!suffix || !prefix) {
    return ZERO_ACCOUNT_ID;
  }
  const prefixString = prefix.toString(16).padStart(16, "0");
  const suffixString = suffix.toString(16).padStart(16, "0");
  return `0x${prefixString}${suffixString}`.slice(0, 32);
};
