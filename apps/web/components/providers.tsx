"use client";
import { type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import GlobalContextProvider from "@/components/global-context/provider";

const Providers = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
  >
    <GlobalContextProvider>{children}</GlobalContextProvider>
  </NextThemesProvider>
);

export default Providers;
