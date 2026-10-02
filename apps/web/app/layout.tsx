import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
// Para's stylesheet ships its own Tailwind preflight, so it must come before
// globals.css for the app's base rules (e.g. border colors) to win.
import "@getpara/react-sdk-lite/styles.css";
import "@miden-sdk/miden-wallet-adapter/styles.css";
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
      {/* .root (isolation: isolate, Base UI's portal setup) wraps only the page
          content: Para renders its login iframe next to it from ParaProvider,
          and that iframe has to stack above Para's modal portaled to body. */}
      <Providers>
        <div className="root">
          {children}
          <Toaster richColors />
        </div>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
