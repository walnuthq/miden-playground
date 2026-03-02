import { access, constants, rm } from "node:fs/promises";
import { execFile as execFileCb, exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { validate, version } from "uuid";
import type { PathLike, RmOptions } from "node:fs";

export const execFile = promisify(execFileCb);

export const exec = promisify(execCb);

export const fileExists = async (fileName: string) => {
  try {
    await access(fileName, constants.F_OK);
    return true; // eslint-disable-next-line
  } catch (_) {
    return false;
  }
};

export const safeRm = async (path: PathLike, options?: RmOptions) => {
  try {
    await rm(path, options);
  } catch (error) {
    console.error(error);
  }
};

export const isValidUuidv4 = (uuid: string) =>
  validate(uuid) && version(uuid) === 4;
