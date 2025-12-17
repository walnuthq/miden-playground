import { execFile } from "@/lib/utils";
import { projectRoot } from "@/lib/constants";

export const midenPackageManifest = async (maspPath: string) => {
  const { stdout } = await execFile("./miden-package-manifest", [maspPath], {
    cwd: `${projectRoot}/miden-package-manifest/target/release`,
  });
  return stdout;
};
