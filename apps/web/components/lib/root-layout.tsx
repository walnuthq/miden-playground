import { Toaster } from "@workspace/ui/components/sonner";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { Navigate, Outlet, ScrollRestoration, useLocation } from "react-router";
import Providers from "@/components/providers";

// Drops trailing slashes (/accounts/ → /accounts), as Next did: the app
// compares exact pathnames (breadcrumbs, tutorial links). A component of its
// own, so that navigating doesn't re-render RootLayout and the providers,
// which breaks starting a tutorial.
const TrailingSlashRedirect = () => {
  const { pathname, search, hash } = useLocation();
  if (pathname === "/" || !pathname.endsWith("/")) {
    return null;
  }
  return (
    <Navigate
      to={`${pathname.replace(/\/+$/, "") || "/"}${search}${hash}`}
      replace
    />
  );
};

// On a phone the tutorial panel takes the bottom of the screen, and a toast
// there would cover its buttons. A component of its own, not to re-render
// RootLayout (see above).
const AppToaster = () => {
  const isMobile = useIsMobile();
  return (
    <Toaster richColors position={isMobile ? "top-center" : "bottom-center"} />
  );
};

const RootLayout = () => (
  <Providers>
    <TrailingSlashRedirect />
    {/* .root (isolation: isolate, Base UI's portal setup) wraps only the page
        content: Para renders its login iframe next to it from ParaProvider,
        and that iframe has to stack above Para's modal portaled to body. */}
    <div className="root">
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <AppToaster />
    </div>
    <ScrollRestoration />
  </Providers>
);

export default RootLayout;
