import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { type ReactNode } from "react";
import "@demox-labs/miden-wallet-adapter/styles.css";
import "@workspace/ui/globals.css";
import Providers from "@/components/providers";
import { Toaster } from "@workspace/ui/components/sonner";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const RootLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => (
  <html lang="en" suppressHydrationWarning>
    <body
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <Providers>
        {children}
        <Toaster richColors />
      </Providers>
    </body>
    <Script
      src={
        process.env.NODE_ENV !== "production"
          ? "https://scripts.simpleanalyticscdn.com/latest.dev.js"
          : "https://scripts.simpleanalyticscdn.com/latest.js"
      }
    />
  </html>
);

export default RootLayout;
