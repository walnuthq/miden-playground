import { readFile } from "node:fs/promises";
import path from "node:path";

// Warns when the Bread Wallet installed for e2e tests (see ./bread.ts) isn't
// the version pinned in .bread-wallet/version, or when a newer release is out.
// Never fails the run: tests use whatever is installed.
const breadWalletDir = path.resolve(
  import.meta.dirname,
  "../../../.bread-wallet",
);

const readVersion = async (file: string, json = false) => {
  try {
    const content = await readFile(path.join(breadWalletDir, file), "utf8");
    return json
      ? (JSON.parse(content) as { version: string }).version
      : content.trim();
  } catch {
    return null;
  }
};

const latestVersion = async () => {
  try {
    const response = await fetch(
      "https://api.github.com/repos/0xMiden/wallet/releases/latest",
      { signal: AbortSignal.timeout(5_000) },
    );
    const { tag_name: tag } = (await response.json()) as { tag_name: string };
    return tag.replace(/^v/, "");
  } catch {
    return null;
  }
};

export default async function globalSetup() {
  // A custom extension is the caller's business.
  if (process.env.BREAD_EXTENSION_DIR) {
    return;
  }
  const [installed, pinned, latest] = await Promise.all([
    readVersion("extension/manifest.json", true),
    readVersion("version"),
    latestVersion(),
  ]);
  if (!installed) {
    console.warn(
      "Bread Wallet isn't installed: Bread specs will be skipped. Run `pnpm bread-wallet`.",
    );
  } else if (installed !== pinned) {
    console.warn(
      `Bread Wallet ${installed} is installed but ${pinned} is pinned: run \`pnpm bread-wallet\`.`,
    );
  }
  if (latest && pinned && latest !== pinned) {
    console.warn(
      `Bread Wallet ${latest} is out (pinned: ${pinned}): run \`pnpm bread-wallet latest\` to upgrade.`,
    );
  }
}
