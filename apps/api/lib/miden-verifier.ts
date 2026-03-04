import { execFile } from "@/lib/utils";
import { PROJECT_ROOT } from "./constants";

export const midenVerifier = async ({
  networkId = "mtst",
  resourceType,
  resourceId,
  resourcePath = "/dev/null",
  maspPath,
}: {
  networkId?: string;
  resourceType: "account-component" | "note" | "transaction";
  resourceId: string;
  resourcePath?: string;
  maspPath: string;
}) => {
  try {
    await execFile(
      "miden-verifier",
      [networkId, resourceType, resourceId, resourcePath, maspPath],
      { cwd: `${PROJECT_ROOT}/miden-verifier` },
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
