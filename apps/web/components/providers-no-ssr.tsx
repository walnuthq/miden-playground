"use client";
import { type ReactNode } from "react";
import dynamic from "next/dynamic";

const Providers = dynamic(() => import("@/components/providers"), {
  ssr: false,
});

const ProvidersNoSSR = ({ children }: { children: ReactNode }) => (
  <Providers>{children}</Providers>
);

export default ProvidersNoSSR;
