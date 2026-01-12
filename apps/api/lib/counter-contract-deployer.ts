import { execFile } from "@/lib/utils";
import { projectRoot } from "@/lib/constants";

export const counterContractDeployer = async ({
  accountIdPrefix,
  accountIdSuffix,
  masp,
}: {
  accountIdPrefix: string;
  accountIdSuffix: string;
  masp: string;
}) => {
  try {
    const { stdout: address } = await execFile(
      process.env.NODE_ENV === "production"
        ? "counter-contract-deployer"
        : "./counter-contract-deployer",
      [accountIdPrefix, accountIdSuffix, masp],
      {
        cwd:
          process.env.NODE_ENV === "production"
            ? undefined
            : `${projectRoot}/counter-contract-deployer/target/release`,
      }
    );
    return address;
  } catch (error) {
    console.error(error);
    return "";
  }
};
