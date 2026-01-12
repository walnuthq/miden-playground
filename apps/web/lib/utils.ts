import { formatUnits, parseUnits } from "viem";
import { FUNGIBLE_FAUCET_DEFAULT_DECIMALS } from "./constants";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatId = (id: string) => `${id.slice(0, 10)}…${id.slice(-8)}`;

export const formatValue = (value: string) =>
  `${value.slice(0, 18)}…${value.slice(-16)}`;

export const formatDigest = (value: string) =>
  `${value.slice(0, 10)}…${value.slice(-8)}`;

export const getAddressPart = (address: string) => {
  const [addressPart = ""] = address.split("_");
  return addressPart;
};

export const getRoutingParametersPart = (address: string) => {
  const [, routingParametersPart = ""] = address.split("_");
  return routingParametersPart;
};

export const formatAddress = (address: string, networkId: string) => {
  const addressPart = getAddressPart(address);
  return `${networkId}${addressPart.slice(networkId.length).slice(0, 8)}…${addressPart.slice(-8)}`;
};

export const formatAmount = (
  amount: string,
  decimals = FUNGIBLE_FAUCET_DEFAULT_DECIMALS
) =>
  new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(Number(formatUnits(BigInt(amount), decimals)));

export const parseAmount = (
  amount: string,
  decimals = FUNGIBLE_FAUCET_DEFAULT_DECIMALS
) => parseUnits(amount, decimals);

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

export const readFile = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      resolve(typeof fileReader.result === "string" ? fileReader.result : "");
    });
    fileReader.readAsText(file);
  });

export const fromBase64 = (base64: string) =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

export const toBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));
