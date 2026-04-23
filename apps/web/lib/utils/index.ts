import { validate, version } from "uuid";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatId = (id: string) => `${id.slice(0, 10)}…${id.slice(-8)}`;

export const formatValue = (value: string) =>
  `${value.slice(0, 18)}…${value.slice(-16)}`;

export const formatDigest = (value: string) =>
  `${value.slice(0, 10)}…${value.slice(-8)}`;

export const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/.{1,2}/g) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  );

export const fromBase64 = (base64: string) =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

export const toBase64 = (bytes: Uint8Array) => {
  const output = [];
  for (let i = 0; i < bytes.length; i++) {
    output.push(String.fromCharCode(bytes[i]!));
  }
  return btoa(output.join(""));
};

export const isValidUUIDv4 = (uuid: string) =>
  validate(uuid) && version(uuid) === 4;
