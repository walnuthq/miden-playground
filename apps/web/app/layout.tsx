import { Geist, Geist_Mono } from "next/font/google";
import { type ReactNode } from "react";
import "@getpara/react-sdk/styles.css";
import "@miden-sdk/miden-wallet-adapter/styles.css";
import "@workspace/ui/globals.css";
import ProvidersNoSsr from "@/components/providers-no-ssr";
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
      <div className="root">
        <ProvidersNoSsr>
          {children}
          <Toaster richColors />
        </ProvidersNoSsr>
      </div>
    </body>
  </html>
);

export default RootLayout;
