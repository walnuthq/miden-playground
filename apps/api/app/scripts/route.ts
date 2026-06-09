import { type NextRequest, NextResponse } from "next/server";
import type {
  Package,
  Dependency,
  PackageType,
  ScriptExample,
} from "@/lib/types";
import { basicWalletDependency } from "@/lib/default-dependencies";
import { insertPackage } from "@/db/packages";
import { projectTemplateFiles, templates } from "@/lib/templates";
import { generateCargoToml } from "@/lib/utils";
import { API_COMPILE_URL } from "@/lib/constants";

type CreateScriptRequestBody = {
  name: string;
  type: PackageType;
  example: ScriptExample;
};

type CreateScriptResponse = {
  package: Pick<Package, "id" | "name" | "type" | "rust"> & {
    dependencies: Dependency[];
  };
};

const scriptsDependencies: Record<ScriptExample, Dependency[]> = {
  none: [],
  "counter-account": [],
  "p2id-note": [basicWalletDependency],
  "counter-note": [],
} as const;

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, type, example } = body as CreateScriptRequestBody;
    const rust = templates[example === "none" ? type : example];
    const files = {
      [`${name}/.cargo/config.toml`]:
        projectTemplateFiles[".cargo/config.toml"],
      [`${name}/src/lib.rs`]: rust,
      [`${name}/Cargo.toml`]: generateCargoToml({
        name,
        type,
        dependencies: scriptsDependencies[example],
      }),
      [`${name}/miden-toolchain.toml`]:
        projectTemplateFiles["miden-toolchain.toml"],
      [`${name}/rust-toolchain.toml`]:
        projectTemplateFiles["rust-toolchain.toml"],
    };
    // const response = await fetch(`${API_COMPILE_URL}/compile`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     files,
    //     entrypoint: name,
    //   }),
    // });
    const packageId = await insertPackage({
      name,
      type,
      dependencies: scriptsDependencies[example].map(({ id }) => id),
      files,
    });
    return NextResponse.json<CreateScriptResponse>({
      package: {
        id: packageId,
        name,
        type,
        rust,
        dependencies: scriptsDependencies[example],
      },
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
