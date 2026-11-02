// A version 4 UUID with the RFC 9562 variant, as `uuid`'s validate() and
// version() === 4 accepted.
const reUUIDv4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUUIDv4 = (uuid: string) => reUUIDv4.test(uuid);
