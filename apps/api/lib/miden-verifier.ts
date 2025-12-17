import { execFile } from "@/lib/utils";
import { projectRoot } from "@/lib/constants";

export const midenVerifier = async ({
  type,
  resourceId,
  packageId,
}: {
  type: "account-component" | "note" | "transaction";
  resourceId: string;
  packageId: string;
}) => {
  try {
    const { stdout } = await execFile(
      "./miden-verifier",
      [type, resourceId, packageId],
      {
        cwd: `${projectRoot}/miden-verifier/target/release`,
      }
    );
    console.log(stdout);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
