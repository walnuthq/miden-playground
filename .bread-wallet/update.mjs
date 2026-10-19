// Installs Bread Wallet (Miden's browser extension) for tutorials QA and e2e
// tests: the `MidenWallet.<version>.Testnet.zip` asset of
// https://github.com/0xMiden/wallet/releases, unpacked to ./extension.
//
// Usage (from the repo root):
//   pnpm bread-wallet           installs the version pinned in ./version
//   pnpm bread-wallet latest    installs the latest release and pins it
//   pnpm bread-wallet 1.17.5    installs that release and pins it
//   pnpm bread-wallet check     prints the installed, pinned and latest versions
//
// The release's manifest has no `key`, so Chrome would derive the extension ID
// from the folder's path, and wallets in ./profiles would be lost whenever the
// repo (or a worktree) lives elsewhere. KEY pins the ID to EXTENSION_ID.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO = "0xMiden/wallet";
const KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoAmUJzJVlmBvXiemkxejwVkjNP/SZidjyLz4BVtxIaa4T12e86GlhjgOfyM6k6TtcQpASYxS1n7hHiLpB/36YNzKmiZ3tyK/Y5lXqh4ofItVaDmQnbHig1uTEC2d/SfL7K4cnEAa/88bHe2OLvqU695fHOnldDQ3zXFzax4r3JWbaBpCWB4FaLlx1QkKqn1qhUFPMzQ6dKaJwtSYuTYTKMkTnr8rZBKxKe4BTQdm1ait4Dh4RIKEEnSWdfv/w/IP1cvHhM7sKiAtJB0NzQ6X2RsU7p34ElPGchiMKJDsPembx/o4Wg3F4Uc5jbkbUrzhglkEJDzckN2wNpwCRI3+7wIDAQAB";
const EXTENSION_ID = "jifbolkleeelimchpheclfmbehmcgffc";

const root = import.meta.dirname;
const extensionDir = path.join(root, "extension");
const versionFile = path.join(root, "version");

const pinnedVersion = async () => (await readFile(versionFile, "utf8")).trim();

const installedVersion = async () => {
  try {
    const manifest = await readFile(
      path.join(extensionDir, "manifest.json"),
      "utf8",
    );
    return JSON.parse(manifest).version;
  } catch {
    return null;
  }
};

const latestVersion = async () => {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`,
  );
  if (!response.ok) {
    throw new Error(`GitHub API: ${response.status} ${await response.text()}`);
  }
  const { tag_name: tag } = await response.json();
  return tag.replace(/^v/, "");
};

const install = async (version) => {
  const asset = `MidenWallet.${version}.Testnet.zip`;
  const response = await fetch(
    `https://github.com/${REPO}/releases/download/v${version}/${asset}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to download ${asset}: ${response.status}`);
  }
  // Unpacked into a new folder of its own, next to ./extension so that the
  // swap below is a rename.
  const staging = path.join(root, `extension.${process.pid}`);
  const zip = `${staging}.zip`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging);
  try {
    await writeFile(zip, Buffer.from(await response.arrayBuffer()));
    execFileSync("unzip", ["-q", zip, "-d", staging]);
    const manifestPath = path.join(staging, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.version !== version) {
      throw new Error(
        `${asset} contains version ${manifest.version}, expected ${version}`,
      );
    }
    await writeFile(
      manifestPath,
      `${JSON.stringify({ ...manifest, key: KEY }, null, 2)}\n`,
    );
    // Replaced rather than unzipped over: each release renames its hashed
    // chunks, and leftovers from older versions would pile up.
    await rm(extensionDir, { recursive: true, force: true });
    await rename(staging, extensionDir);
  } finally {
    await rm(zip, { force: true });
    await rm(staging, { recursive: true, force: true });
  }
};

const main = async (arg) => {
  if (arg === "check") {
    console.log(`installed: ${(await installedVersion()) ?? "none"}`);
    console.log(`pinned:    ${await pinnedVersion()}`);
    console.log(`latest:    ${await latestVersion()}`);
    return;
  }
  const version = !arg
    ? await pinnedVersion()
    : arg === "latest"
      ? await latestVersion()
      : arg.replace(/^v/, "");
  if ((await installedVersion()) === version) {
    console.log(`Bread Wallet ${version} is already installed.`);
  } else {
    console.log(`Installing Bread Wallet ${version}…`);
    await install(version);
    console.log(`Installed Bread Wallet ${version} in ${extensionDir}`);
  }
  if (version !== (await pinnedVersion())) {
    await writeFile(versionFile, `${version}\n`);
    console.log(`Pinned ${version} in ${versionFile}: commit it.`);
  }
  console.log(`Extension ID: ${EXTENSION_ID}`);
};

await main(process.argv[2]);
