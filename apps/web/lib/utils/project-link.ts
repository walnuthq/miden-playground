import { isValidUUIDv4 } from "@/lib/utils";

// A project link (spec/project-links.md): the network, the scripts and the
// public accounts of a project, in the URL's fragment, which never reaches
// the Worker or the analytics. Opening it forks the scripts into a new
// sandbox and imports the accounts by address (hooks/use-project-link.ts).
//
//   /open#v=1&n=mtst&t=<title>&s=<id>,<id>&a=<name>:<address>,…
//
// Each item is encodeURIComponent'd, so a name can hold `:`, `,` and `&`.
// `v` names the format: a stored form can come later as another version.

export const PROJECT_LINK_VERSION = "1";

export const MAX_LINK_SCRIPTS = 16;
export const MAX_LINK_ACCOUNTS = 16;
export const MAX_LINK_TITLE_LENGTH = 80;
export const MAX_LINK_ACCOUNT_NAME_LENGTH = 40;
const MAX_ADDRESS_LENGTH = 128;

// Not the MockChain sandbox, whose chain lives in one browser, nor Local.
export const projectLinkNetworkIds = ["mtst", "mdev", "mm"] as const;

export type ProjectLinkNetworkId = (typeof projectLinkNetworkIds)[number];

export const isProjectLinkNetworkId = (
  networkId: string,
): networkId is ProjectLinkNetworkId =>
  (projectLinkNetworkIds as readonly string[]).includes(networkId);

export type ProjectLinkAccount = { name: string; address: string };

export type ProjectLink = {
  networkId: ProjectLinkNetworkId;
  title: string;
  scriptIds: string[];
  accounts: ProjectLinkAccount[];
};

// An address of the network: its bech32 prefix, then the account id and an
// optional routing suffix (`mtst1ar…_qr7…`). The client checks the rest.
export const isNetworkAddress = (
  address: string,
  networkId: ProjectLinkNetworkId,
) =>
  address.length <= MAX_ADDRESS_LENGTH &&
  new RegExp(`^${networkId}1[a-z0-9]+(_[a-z0-9]+)?$`).test(address);

const bounded = (text: string, max: number) => text.trim().slice(0, max);

export const projectLinkFragment = ({
  networkId,
  title,
  scriptIds,
  accounts,
}: ProjectLink) => {
  const params = [
    `v=${PROJECT_LINK_VERSION}`,
    `n=${networkId}`,
    ...(title.trim()
      ? [`t=${encodeURIComponent(bounded(title, MAX_LINK_TITLE_LENGTH))}`]
      : []),
    `s=${scriptIds.map(encodeURIComponent).join(",")}`,
    ...(accounts.length > 0
      ? [
          `a=${accounts
            .map(
              ({ name, address }) =>
                `${encodeURIComponent(bounded(name, MAX_LINK_ACCOUNT_NAME_LENGTH))}:${encodeURIComponent(address)}`,
            )
            .join(",")}`,
        ]
      : []),
  ];
  return params.join("&");
};

export const projectLinkUrl = (origin: string, link: ProjectLink) =>
  `${origin}/open#${projectLinkFragment(link)}`;

const decode = (text: string) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return null;
  }
};

export type ParsedProjectLink =
  | {
      link: ProjectLink;
      // Items left out: malformed, of another network, duplicated or past the
      // bounds. The page says so; the rest opens.
      droppedScripts: number;
      droppedAccounts: number;
    }
  | { error: string };

// Reads a link's fragment (`location.hash`, with or without its `#`). The
// title and the names are the link's author's text: shown as text only.
export const parseProjectLink = (hash: string): ParsedProjectLink => {
  const params = new Map<string, string>();
  for (const part of hash.replace(/^#/, "").split("&")) {
    const separator = part.indexOf("=");
    if (separator > 0 && !params.has(part.slice(0, separator))) {
      params.set(part.slice(0, separator), part.slice(separator + 1));
    }
  }
  const version = params.get("v");
  if (version === undefined) {
    return { error: "This isn't a project link." };
  }
  if (version !== PROJECT_LINK_VERSION) {
    return {
      error:
        "This link was made by a newer version of the playground. Reload the page, then try again.",
    };
  }
  const networkId = params.get("n") ?? "";
  if (!isProjectLinkNetworkId(networkId)) {
    return { error: "This link names a network the playground can't open." };
  }
  const title = bounded(
    decode(params.get("t") ?? "") ?? "",
    MAX_LINK_TITLE_LENGTH,
  );
  const scriptItems = (params.get("s") ?? "").split(",").filter(Boolean);
  const scriptIds = [
    ...new Set(
      scriptItems
        .map(decode)
        .filter((id): id is string => id !== null && isValidUUIDv4(id)),
    ),
  ].slice(0, MAX_LINK_SCRIPTS);
  if (scriptIds.length === 0) {
    return { error: "This link holds no script." };
  }
  const accountItems = (params.get("a") ?? "").split(",").filter(Boolean);
  const accounts: ProjectLinkAccount[] = [];
  for (const item of accountItems) {
    const separator = item.lastIndexOf(":");
    const name = decode(item.slice(0, separator));
    const address = decode(item.slice(separator + 1));
    if (
      separator < 0 ||
      name === null ||
      address === null ||
      !isNetworkAddress(address, networkId) ||
      accounts.some((account) => account.address === address) ||
      accounts.length >= MAX_LINK_ACCOUNTS
    ) {
      continue;
    }
    accounts.push({
      name:
        bounded(name, MAX_LINK_ACCOUNT_NAME_LENGTH) ||
        `Account ${accounts.length + 1}`,
      address,
    });
  }
  return {
    link: { networkId, title, scriptIds, accounts },
    droppedScripts: scriptItems.length - scriptIds.length,
    droppedAccounts: accountItems.length - accounts.length,
  };
};

// An account of the workspace as "Share project" offers it (decision 3 of the
// spec): public accounts on chain ticked, the connected wallet unticked, the
// others shown disabled with the reason. The network's faucet isn't offered:
// every sandbox has it.
export type ShareableAccount = {
  id: string;
  name: string;
  address: string;
  checked: boolean;
  disabledReason?: string;
};

export const shareableAccounts = (
  accounts: {
    id: string;
    name: string;
    address: string;
    isPublic: boolean;
    isNew: boolean;
  }[],
  {
    networkId,
    faucetId,
    isConnectedWallet,
  }: {
    networkId: ProjectLinkNetworkId;
    faucetId: string;
    isConnectedWallet: (id: string) => boolean;
  },
): ShareableAccount[] =>
  accounts
    .filter(({ id }) => id !== faucetId)
    .map(({ id, name, address, isPublic, isNew }) => {
      const disabledReason = !isPublic
        ? "Private: its state isn't on chain for others to read."
        : isNew
          ? "Not on chain yet: it shows up once it has a transaction."
          : !isNetworkAddress(address, networkId)
            ? "Its address isn't one of this network."
            : undefined;
      return {
        id,
        name,
        address,
        checked: disabledReason === undefined && !isConnectedWallet(id),
        ...(disabledReason !== undefined && { disabledReason }),
      };
    });
