"use client";
import { type ReactNode, useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { saPageView } from "@/lib/simple-analytics";

const SimpleAnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const { connecting, connected: walletConnected } = useWallet();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (!scriptLoaded || connecting) {
      return;
    }
    saPageView(pathname, { wallet_connected: walletConnected });
  }, [scriptLoaded, pathname, connecting, walletConnected]);
  return (
    <>
      {children}
      <Script
        src={
          process.env.NODE_ENV !== "production" ? "/proxy.dev.js" : "/proxy.js"
        }
        data-auto-collect="false"
        onLoad={() => setScriptLoaded(true)}
      />
    </>
  );
};

export default SimpleAnalyticsProvider;
