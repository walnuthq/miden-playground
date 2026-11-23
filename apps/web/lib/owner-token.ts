// The browser's owner token: a random secret, created on first use and kept
// in localStorage, sent with every API call that creates or changes a script.
// The API stores its hash on the scripts it creates and lets only its holder
// compile or delete them (apps/api/lib/owner.ts): a shared link gives read
// access. One per browser, not per sandbox or saved project: they share
// scripts by id. Clearing the site's data loses it, and the scripts created
// with it then open read-only, with Fork. SDK-free: the app shell's
// breadcrumb fetches scripts.

const STORAGE_KEY = "owner-token";

// 32 random bytes in hex.
const reOwnerToken = /^[0-9a-f]{64}$/;

// Kept for the page's life when localStorage refuses to store it.
let memoryToken: string | undefined;

const readToken = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    return token !== null && reOwnerToken.test(token) ? token : undefined;
  } catch {
    return undefined;
  }
};

export const newOwnerToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

export const ownerToken = () => {
  const stored = readToken();
  if (stored) {
    return stored;
  }
  memoryToken ??= newOwnerToken();
  try {
    localStorage.setItem(STORAGE_KEY, memoryToken);
  } catch {
    // Private mode or a full quota: the token lasts as long as the page.
  }
  // Another tab may have stored its own meanwhile: the stored one wins.
  return readToken() ?? memoryToken;
};

// The header the API reads the token from.
export const ownerHeaders = () => ({
  Authorization: `Bearer ${ownerToken()}`,
});
