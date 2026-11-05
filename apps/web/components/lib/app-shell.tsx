import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { useLocation } from "react-router";
import useGlobalContext from "@/components/global-context/hook";
import Home from "@/components/home";
import { AppSidebarView } from "@/components/lib/app-sidebar";
import GithubButton from "@/components/lib/github-button";
import { HeaderView } from "@/components/lib/header";
import Loading from "@/components/lib/loading";
import ModeToggle from "@/components/lib/mode-toggle";
import { NetworkBadgeView } from "@/components/lib/network-badge";
import {
  ProjectSwitcherView,
  projectTitle,
} from "@/components/lib/project-switcher";
import { AppLayout } from "@/components/lib/sidebar-layout";
import useNetwork from "@/hooks/use-network";

// Shown while the Miden client initializes (MidenProvider's
// `loadingComponent`): the app's layout, with the project's sidebar and the
// home page from the app state, every action disabled until the client is
// ready. It renders in place of the whole app, outside the SDK's context, so
// it uses no hook of the Miden client (nor of hooks built on them), and
// recreates RootLayout's wrappers, which it replaces too.
const AppShell = () => {
  const { pathname } = useLocation();
  const { networkId } = useNetwork();
  const { tutorialId, exampleId } = useGlobalContext();
  return (
    <div className="root">
      <TooltipProvider>
        <AppLayout
          sidebar={
            <AppSidebarView
              header={
                <ProjectSwitcherView
                  title={projectTitle({ tutorialId, exampleId, networkId })}
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
          {pathname === "/" ? <Home pending /> : <Loading />}
        </AppLayout>
      </TooltipProvider>
    </div>
  );
};

export default AppShell;
