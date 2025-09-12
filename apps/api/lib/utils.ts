import { access, constants } from "node:fs/promises";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

export const execFile = promisify(execFileCb);

export const fileExists = async (fileName: string) => {
  try {
    await access(fileName, constants.F_OK);
    return true; // eslint-disable-next-line
  } catch (_) {
    return false;
  }
};
