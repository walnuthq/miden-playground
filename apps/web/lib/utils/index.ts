import { validate, version } from "uuid";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitUntil = (predicate: () => Promise<boolean>, ms = 1000) =>
  new Promise((resolve) => {
    const id = setInterval(async () => {
      const result = await predicate();
      if (result) {
        clearInterval(id);
        resolve(result);
      }
    }, ms);
  });

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

export const kebabCase = (str: string) =>
  str
    // insert hyphen between a lower-case letter/digit and an upper-case letter
    // e.g. "authComponent" -> "auth-Component", but "falcon512" stays untouched
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    // insert hyphen between the end of an acronym and the start of a new word
    // e.g. "RPOFalcon" -> "RPO-Falcon"
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    // normalize existing separators (spaces, underscores, existing hyphens) to '-'
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/^-|-$/g, "");
