import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { useLocation } from "react-router";
import useGlobalContext from "@/components/global-context/hook";
import { HomeView } from "@/components/home/home-view";
import { AppLayout } from "@/components/lib/app-layout";
import { AppSidebarView } from "@/components/lib/app-sidebar-view";
import GithubButton from "@/components/lib/github-button";
import { HeaderView } from "@/components/lib/header-view";
import Loading from "@/components/lib/loading";
import ModeToggle from "@/components/lib/mode-toggle";
import { NetworkBadgeView } from "@/components/lib/network-badge-view";
import {
  ProjectSwitcherView,
  projectTitle,
} from "@/components/lib/project-switcher-view";
import useNetwork from "@/hooks/use-network";

// The app's layout, with the project's sidebar and the home page from the app
// state, every action disabled until the client is ready. Shown three times
// in a row on a first visit, with the same markup each time, so nothing
// flashes: as the root route's HydrateFallback (routes.tsx) before the SDK's
// chunks and WASM load, then as MidenProvider's `loadingComponent` while the
// client initializes, then as Para's `fallback`. So: no state in here that
// has to survive a remount.
//
// It renders outside the SDK's context, and before the SDK exists at all, so
// its module graph imports nothing from the SDK or Para (the build checks:
// `shellIsSdkFree` in vite.config.ts): the `*View` components, fed from
// `useGlobalContext` and `useNetwork` (OuterProviders, around the router).
// It recreates RootLayout's wrappers, which it replaces too.
const AppShell = () => {
  const { pathname } = useLocation();
  const { networkId } = useNetwork();
  const { projectName, tutorialId, exampleId } = useGlobalContext();
  return (
    <div className="root">
      <TooltipProvider>
        <AppLayout
          sidebar={
            <AppSidebarView
              header={
                <ProjectSwitcherView
                  title={projectTitle({
                    projectName,
                    tutorialId,
                    exampleId,
                    networkId,
                  })}
                />
              }
            />
          }
        >
          <HeaderView
            actions={
              <>
                <GithubButton className="hidden md:block" />
                <NetworkBadgeView networkId={networkId} syncing />
                <ModeToggle />
              </>
            }
          />
          {pathname === "/" ? <HomeView /> : <Loading />}
        </AppLayout>
      </TooltipProvider>
    </div>
  );
};

export default AppShell;
