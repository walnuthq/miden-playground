// Who may change a package. The web app keeps a random secret in the browser
// (its owner token) and sends it as `Authorization: Bearer <token>`; a package
// stores the SHA-256 of its creator's (`packages.owner_key_hash`).
// spec/share-and-fork-scripts.md has the decisions.

// 32 random bytes in hex from the web app; any URL-safe secret of a sane
// length from tooling.
const reOwnerToken = /^[A-Za-z0-9_-]{32,128}$/;

// The token of an `Authorization` header: undefined without the header, null
// when it isn't a bearer token of the expected shape.
export const ownerToken = (authorization: string | undefined | null) => {
  if (authorization === undefined || authorization === null) {
    return undefined;
  }
  const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
  if (
    scheme?.toLowerCase() !== "bearer" ||
    token === undefined ||
    rest.length > 0 ||
    !reOwnerToken.test(token)
  ) {
    return null;
  }
  return token;
};

// What a package stores of its owner's token, as 64 hex characters.
export const hashOwnerToken = async (token: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

// Compares two hashes without stopping at the first difference.
const sameHash = (a: string, b: string) => {
  if (a.length !== b.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
};

// What a write to a package gets, given its stored owner and the caller's
// token hash:
// - `allow`: the caller owns it.
// - `claim`: it has no owner (created before owners existed) and the caller
//   sent a token, which becomes its owner.
// - `deny`: it has another owner, or the caller sent no token. Every web app
//   sends one: the routes answer a write without a token with a 401 before
//   asking.
export const writeAccess = ({
  ownerKeyHash,
  tokenHash,
}: {
  ownerKeyHash: string | null;
  tokenHash: string | undefined;
}): "allow" | "claim" | "deny" => {
  if (tokenHash === undefined) {
    return "deny";
  }
  if (ownerKeyHash === null) {
    return "claim";
  }
  return sameHash(ownerKeyHash, tokenHash) ? "allow" : "deny";
};

// Whether the caller could write to the package: what `GET /scripts/:id`
// reports, so the web app shows another owner's script read-only.
export const isWritable = (access: {
  ownerKeyHash: string | null;
  tokenHash: string | undefined;
}) => writeAccess(access) !== "deny";
