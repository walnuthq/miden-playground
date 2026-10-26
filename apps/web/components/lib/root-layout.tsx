import { Toaster } from "@workspace/ui/components/sonner";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { Outlet, ScrollRestoration } from "react-router";
import Providers from "@/components/providers";

const RootLayout = () => (
  <Providers>
    {/* .root (isolation: isolate, Base UI's portal setup) wraps only the page
        content: Para renders its login iframe next to it from ParaProvider,
        and that iframe has to stack above Para's modal portaled to body. */}
    <div className="root">
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Toaster richColors position="bottom-center" />
    </div>
    <ScrollRestoration />
  </Providers>
);

export default RootLayout;
