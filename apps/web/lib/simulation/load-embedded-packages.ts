import { useEffect, useState } from "react";
import type { Script } from "@/lib/types/script";

// The packages the web app embeds (lib/simulation/embedded-packages.ts),
// loaded once, on demand: their masp is large and the script page mustn't
// carry it.
let embeddedPackagesPromise: Promise<Script[]> | undefined;
let embeddedPackages: Script[] | undefined;

export const loadEmbeddedPackages = () => {
  embeddedPackagesPromise ??= import("@/lib/simulation/embedded-packages")
    .then((module) => {
      embeddedPackages = module.embeddedPackages;
      return module.embeddedPackages;
    })
    .catch((error) => {
      embeddedPackagesPromise = undefined;
      throw error;
    });
  return embeddedPackagesPromise;
};

// The embedded packages once loaded, loading them when `needed`.
export const useEmbeddedPackages = (needed: boolean) => {
  const [loaded, setLoaded] = useState(embeddedPackages);
  useEffect(() => {
    if (needed && !loaded) {
      loadEmbeddedPackages().then(setLoaded, () => {});
    }
  }, [needed, loaded]);
  return loaded;
};
