import { execFile } from "@/lib/utils";
import { projectRoot } from "@/lib/constants";

export const midenVerifier = async ({
  type,
  resource,
  masp,
}: {
  type: "account-component" | "note" | "transaction";
  resource: string;
  masp: string;
}) => {
  try {
    await execFile(
      process.env.NODE_ENV === "production"
        ? "miden-verifier"
        : "./miden-verifier",
      [type, resource, masp],
      {
        cwd:
          process.env.NODE_ENV === "production"
            ? undefined
            : `${projectRoot}/miden-verifier/target/release`,
      }
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
