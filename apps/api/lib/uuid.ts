import { validate, version } from "uuid";

export const isValidUUIDv4 = (uuid: string) =>
  validate(uuid) && version(uuid) === 4;
