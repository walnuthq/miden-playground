import { Toaster } from "@workspace/ui/components/sonner";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { Navigate, Outlet, ScrollRestoration, useLocation } from "react-router";
import Providers from "@/components/providers";

const RootLayout = () => {
  const { pathname, search, hash } = useLocation();
  // Drop trailing slashes (/accounts/ → /accounts), as Next did: the app
  // compares exact pathnames (breadcrumbs, tutorial links).
  if (pathname !== "/" && pathname.endsWith("/")) {
    return (
      <Navigate
        to={`${pathname.replace(/\/+$/, "") || "/"}${search}${hash}`}
        replace
      />
    );
  }
  return (
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
};

export default RootLayout;
