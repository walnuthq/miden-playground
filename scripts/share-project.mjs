#!/usr/bin/env node
// Shares a local Miden project as a playground link (spec/project-links.md,
// docs/share-project.md): uploads the folder's packages to the playground's
// API, which compiles them, then prints a link that opens them, as the
// reader's own copies, in a new sandbox. No dependency: Node 22 or later.
//
//   node scripts/share-project.mjs <folder> [--network mtst] [--title "…"]
//     [--account <name>=<address>]…
//
// A package that doesn't compile prints the compiler's error and exits 1, so
// it doubles as a remote build check.

import { randomBytes } from "node:crypto";
import { realpathSync } from "node:fs";
import { chmod, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

class UsageError extends Error {}

const DEFAULT_API_URL = "https://miden-playground-api.walnut.dev";
const DEFAULT_WEB_URL = "https://playground.miden.xyz";

// The API's limits (apps/api/lib/validation.ts), checked here first so the
// message names the package.
export const MAX_PACKAGES = 16;
export const MAX_SOURCE_LENGTH = 512_000;
export const MAX_MANIFEST_LENGTH = 16_384;
export const MAX_BODY_SIZE = 2 * 1024 * 1024;
const MAX_TITLE_LENGTH = 80;
const MAX_ACCOUNTS = 16;
const MAX_ACCOUNT_NAME_LENGTH = 40;
const NETWORKS = ["mtst", "mdev", "mm"];

const MANIFEST = "miden-project.toml";
const SOURCE = "src/lib.rs";

// A copy of findPackages (apps/web/lib/utils/project-files.ts), which "Import
// Project" uses: keep the two in step (project-files.test.ts runs both on the
// same paths). Paths are relative to the folder's parent, the folder's name
// first, as a browser's folder picker gives them.
const skippedDirectory = (segment) =>
  segment === "target" || segment === "node_modules" || segment.startsWith(".");

export const findPackages = (paths) => {
  const pathSet = new Set(paths);
  return paths
    .filter((path) => {
      const segments = path.split("/");
      return (
        segments.at(-1) === MANIFEST &&
        !segments.slice(0, -1).some(skippedDirectory)
      );
    })
    .map((manifestPath) => {
      const directory = manifestPath.slice(0, -`/${MANIFEST}`.length);
      return {
        directory,
        manifestPath,
        sourcePath: directory === "" ? SOURCE : `${directory}/${SOURCE}`,
      };
    })
    .filter(({ sourcePath }) => pathSet.has(sourcePath))
    .sort((a, b) => a.directory.localeCompare(b.directory));
};

// The folder's files, as paths from its parent. Skips what findPackages
// skips without reading it: target/ can hold thousands of files.
const listFiles = async (folder) => {
  const root = basename(folder);
  const paths = [];
  const walk = async (directory, relative) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${relative}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!skippedDirectory(entry.name)) {
          await walk(join(directory, entry.name), path);
        }
      } else if (entry.isFile()) {
        paths.push(path);
      }
    }
  };
  await walk(folder, root);
  return paths;
};

// The owner token (apps/api/lib/owner.ts): any URL-safe secret of 32 to 128
// characters. Kept across runs so the uploaded scripts keep one owner.
const ownerToken = async () => {
  const directory = join(
    // biome-ignore lint/suspicious/noUndeclaredEnvVars: run by hand, not by turbo
    process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
    "miden-playground",
  );
  const path = join(directory, "token");
  try {
    const token = (await readFile(path, "utf8")).trim();
    if (/^[\w-]{32,128}$/.test(token)) {
      return token;
    }
  } catch {
    // None yet.
  }
  const token = randomBytes(32).toString("base64url");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(path, `${token}\n`, { mode: 0o600 });
  await chmod(path, 0o600);
  return token;
};

// An address of the network, as the playground checks it
// (apps/web/lib/utils/project-link.ts): bech32 prefix, then the account id and
// an optional routing suffix.
export const isNetworkAddress = (address, networkId) =>
  address.length <= 128 &&
  new RegExp(`^${networkId}1[a-z0-9]+(_[a-z0-9]+)?$`).test(address);

// `--account <name>=<address>`, the address being the text after the last `=`.
export const parseAccount = (value, networkId) => {
  const separator = value.lastIndexOf("=");
  const name = value.slice(0, separator).trim();
  const address = value.slice(separator + 1).trim();
  if (separator < 1 || name === "") {
    throw new UsageError(`--account ${value}: give it as <name>=<address>.`);
  }
  if (name.length > MAX_ACCOUNT_NAME_LENGTH) {
    throw new UsageError(
      `--account ${value}: the name is over ${MAX_ACCOUNT_NAME_LENGTH} characters.`,
    );
  }
  if (!isNetworkAddress(address, networkId)) {
    throw new UsageError(
      `--account ${value}: not an address of ${networkId} (it starts with ${networkId}1).`,
    );
  }
  return { name, address };
};

// The link, as apps/web/lib/utils/project-link.ts builds it.
export const projectLink = (
  webUrl,
  { networkId, title, scriptIds, accounts = [] },
) =>
  `${webUrl}/open#${[
    "v=1",
    `n=${networkId}`,
    ...(title ? [`t=${encodeURIComponent(title)}`] : []),
    `s=${scriptIds.join(",")}`,
    ...(accounts.length > 0
      ? [
          `a=${accounts
            .map(
              ({ name, address }) =>
                `${encodeURIComponent(name)}:${encodeURIComponent(address)}`,
            )
            .join(",")}`,
        ]
      : []),
  ].join("&")}`;

const usage = `Usage: node scripts/share-project.mjs <folder> [options]

Uploads the Miden packages in <folder> (each directory with a
miden-project.toml and src/lib.rs) to the playground, which compiles them,
and prints a link that opens them in a new sandbox.

Options:
  --network <id>  mtst (testnet, default), mdev (devnet) or mm (Mainnet)
  --title <text>  the project's title, shown when the link is opened
  --account <name>=<address>
                  a public account deployed on the network, imported by
                  address when the link is opened (repeat for several)
  --api <url>     the playground's API (default ${DEFAULT_API_URL})
  --web <url>     the playground (default ${DEFAULT_WEB_URL})
  -h, --help      this help

An account lists these scripts as its components when its code holds their
procedures, matched by digest: a local cargo-miden build gives the
playground's digests when it uses the same dependency versions (the
Cargo.lock of a script the playground exports). If yours differ, deploy the
account from the playground instead: open the link, deploy, then "Share
project" in the Projects menu.`;

export const main = async (args) => {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      network: { type: "string", default: "mtst" },
      title: { type: "string", default: "" },
      account: { type: "string", multiple: true, default: [] },
      api: { type: "string", default: DEFAULT_API_URL },
      web: { type: "string", default: DEFAULT_WEB_URL },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) {
    console.log(usage);
    return 0;
  }
  if (positionals.length !== 1) {
    throw new UsageError("Give one folder.");
  }
  if (!NETWORKS.includes(values.network)) {
    throw new UsageError(
      `Unknown network ${values.network}: use ${NETWORKS.join(", ")}.`,
    );
  }
  const title = values.title.trim();
  if (title.length > MAX_TITLE_LENGTH) {
    throw new UsageError(`The title is over ${MAX_TITLE_LENGTH} characters.`);
  }
  const accounts = values.account.map((value) =>
    parseAccount(value, values.network),
  );
  if (accounts.length > MAX_ACCOUNTS) {
    throw new UsageError(
      `${accounts.length} accounts: ${MAX_ACCOUNTS} at most.`,
    );
  }
  if (new Set(accounts.map(({ address }) => address)).size < accounts.length) {
    throw new UsageError("An address is given twice.");
  }
  const folder = resolve(positionals[0]);
  const parent = dirname(folder);
  const packages = findPackages(await listFiles(folder));
  if (packages.length === 0) {
    throw new UsageError(
      `No package in ${folder}: a package is a directory with ${MANIFEST} and ${SOURCE}.`,
    );
  }
  if (packages.length > MAX_PACKAGES) {
    throw new UsageError(
      `${packages.length} packages: the playground takes ${MAX_PACKAGES} at most in one project.`,
    );
  }
  const packageSources = {};
  for (const { directory, manifestPath, sourcePath } of packages) {
    const midenProjectToml = await readFile(join(parent, manifestPath), "utf8");
    const rust = await readFile(join(parent, sourcePath), "utf8");
    if (midenProjectToml.length > MAX_MANIFEST_LENGTH) {
      throw new UsageError(
        `${manifestPath} is over ${MAX_MANIFEST_LENGTH} characters.`,
      );
    }
    if (rust.length === 0 || rust.length > MAX_SOURCE_LENGTH) {
      throw new UsageError(
        `${sourcePath} is empty or over ${MAX_SOURCE_LENGTH} characters (512 KB).`,
      );
    }
    packageSources[directory] = { midenProjectToml, rust };
  }
  const body = JSON.stringify({ packageSources });
  if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
    throw new UsageError(
      "The sources are over 2 MB in all: the playground takes 2 MB at most in one request.",
    );
  }
  console.error(
    `Uploading ${packages.length} package${packages.length === 1 ? "" : "s"} (${packages.map(({ directory }) => basename(directory)).join(", ")}): the playground compiles them, which can take a minute…`,
  );
  const response = await fetch(`${values.api}/scripts/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await ownerToken()}`,
    },
    body,
  });
  if (!response.ok) {
    console.error(
      `The playground refused the upload (${response.status}): ${(await response.text()).trim()}`,
    );
    return 1;
  }
  const { packages: compiled } = await response.json();
  const failed = compiled.filter(({ status }) => status !== "compiled");
  for (const { name, error } of failed) {
    console.error(`\n${name} doesn't compile:\n${error}`);
  }
  if (failed.length > 0) {
    return 1;
  }
  for (const { name, type, id } of compiled) {
    console.error(`  ${name} (${type}): ${values.web}/scripts/${id}`);
  }
  // Every package is listed: a dependency forks with its dependents anyway,
  // and a link that names it opens it even when nothing depends on it.
  console.log(
    projectLink(values.web, {
      networkId: values.network,
      title,
      scriptIds: compiled.map(({ id }) => id),
      accounts,
    }),
  );
  return 0;
};

const isEntryPoint =
  process.argv[1] !== undefined &&
  pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    if (
      error instanceof UsageError ||
      error?.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION"
    ) {
      console.error(`${error.message}\n\n${usage}`);
      process.exitCode = 2;
    } else {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
