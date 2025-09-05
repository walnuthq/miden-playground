import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

export const execFile = promisify(execFileCb);
