import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import GlobalContextProvider from "@/components/global-context/provider";
import { NetworkProvider } from "@/components/providers/network-provider";

const queryClient = new QueryClient();

// The providers the app shell needs, around the router (main.tsx). They
// import nothing from the SDK and use no router hook, and they stay mounted
// from the shell (the root route's HydrateFallback, rendered before the SDK's
// chunks load) through to the app, so the app state is read from storage
// once. The SDK-bound providers are `Providers` (index.tsx), in RootLayout.
const OuterProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
    // Its anti-flash script never runs in a client-rendered app (index.html has
    // the equivalent): mark it as a data block so React doesn't warn about it.
    scriptProps={{ type: "application/json" }}
  >
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        {/* Above MidenProvider, which unmounts its children while the client
        re-initializes (e.g. on a network switch): the state queued for the
        new network (`nextState`, not persisted) has to survive it. */}
        <GlobalContextProvider>{children}</GlobalContextProvider>
      </NetworkProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default OuterProviders;
