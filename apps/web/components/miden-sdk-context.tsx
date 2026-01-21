"use client";
import { createContext, useState, useEffect, type ReactNode } from "react";
import { type MidenSdk } from "@/lib/types";

export const MidenSdkContext = createContext<{
  midenSdk: MidenSdk;
}>({
  midenSdk: {} as MidenSdk,
});

export const MidenSdkProvider = ({ children }: { children: ReactNode }) => {
  const [midenSdk, setMidenSdk] = useState<MidenSdk | null>(null);
  useEffect(() => {
    const loadMidenSdk = async () => {
      const sdk = await import("@demox-labs/miden-sdk");
      setMidenSdk(sdk);
    };
    loadMidenSdk();
  }, [midenSdk]);
  if (!midenSdk) {
    return null;
  }
  console.log("MidenSdk loaded:", midenSdk);
  return <MidenSdkContext value={{ midenSdk }}>{children}</MidenSdkContext>;
};
