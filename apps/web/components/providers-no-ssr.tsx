"use client";
import dynamic from "next/dynamic";
import { type ReactNode } from "react";

const Providers = dynamic(() => import("@/components/providers"), {
  ssr: false,
});

const ProvidersNoSSR = ({ children }: { children: ReactNode }) => (
  <Providers>{children}</Providers>
);

export default ProvidersNoSSR;
