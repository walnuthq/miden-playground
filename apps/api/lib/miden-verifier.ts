import { execFile } from "@/lib/utils";
import { PROJECT_ROOT } from "@/lib/constants";

export const midenVerifier = async ({
  networkId = "mtst",
  resourceType,
  resourceId,
  resourcePath = "/dev/null",
  maspPath = "/dev/null",
}: {
  networkId?: string;
  resourceType: "account-component" | "note-script" | "transaction-script";
  resourceId: string;
  resourcePath?: string;
  maspPath?: string;
}) => {
  try {
    console.info(
      `miden-verifier ${networkId} ${resourceType} ${resourceId} ${resourcePath} ${maspPath}`,
    );
    const { stdout } = await execFile(
      "miden-verifier",
      [networkId, resourceType, resourceId, resourcePath, maspPath],
      { cwd: `${PROJECT_ROOT}/miden-verifier` },
    );
    return stdout
      .split("\n")
      .map((result) => result.trim())
      .filter((result) => result !== "");
  } catch (error) {
    console.error(error);
    throw new Error("Error: miden-verifier failed");
  }
};

export const midenAccountComponentVerifier = ({
  networkId = "mtst",
  resourceId,
  resourcePath = "/dev/null",
  maspPath = "/dev/null",
}: {
  networkId?: string;
  resourceId: string;
  resourcePath?: string;
  maspPath?: string;
}) =>
  midenVerifier({
    networkId,
    resourceType: "account-component",
    resourceId,
    resourcePath,
    maspPath,
  });

export const midenNoteVerifier = async ({
  networkId = "mtst",
  resourceId,
  resourcePath = "/dev/null",
  maspPath = "/dev/null",
}: {
  networkId?: string;
  resourceId: string;
  resourcePath?: string;
  maspPath?: string;
}) => {
  const results = await midenVerifier({
    networkId,
    resourceType: "note-script",
    resourceId,
    resourcePath,
    maspPath,
  });
  const [noteScript = ""] = results;
  return noteScript;
};
