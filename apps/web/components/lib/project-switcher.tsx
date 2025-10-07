"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
  // DropdownMenuGroup,
  // DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import Logo from "@/components/lib/logo";
import useGlobalContext from "@/components/global-context/hook";
import tutorials from "@/components/tutorials";
import useTutorials from "@/hooks/use-tutorials";
// import useProjects from "@/hooks/use-projects";
import { useIsClient } from "usehooks-ts";
import { networks } from "@/lib/types/network";
// import { cn } from "@workspace/ui/lib/utils";
import useAccounts from "@/hooks/use-accounts";
import { useWallet } from "@demox-labs/miden-wallet-adapter";

const ProjectSwitcher = () => {
  const isClient = useIsClient();
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { accountId } = useWallet();
  const { networkId, blockNum, resetState /*, switchNetwork */ } =
    useGlobalContext();
  const { tutorialId, tutorialLoaded, startTutorial, loadTutorial } =
    useTutorials();
  const { wallets } = useAccounts();
  // const { saveProject, loadProject } = useProjects();
  useEffect(() => {
    /* const connectedWallet = wallets.find(
      ({ address }) => address === accountId
    );
    if (!connectedWallet) {
      return;
    } */
    if (!tutorialLoaded) {
      loadTutorial(tutorialId);
    }
  }, [wallets, accountId, tutorialId, tutorialLoaded, loadTutorial]);
  if (!isClient) {
    return null;
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                <Logo className="size-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Miden Playground</span>
                <span className="truncate text-xs">
                  {networks[networkId]} - Block #{blockNum}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {/* <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={!!tutorialId}
                className={cn({ "text-muted-foreground": !!tutorialId })}
              >
                Switch network
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {Object.keys(networks).map((networkId) => (
                    <DropdownMenuItem
                      key={networkId}
                      onClick={() => switchNetwork(networkId as NetworkId)}
                    >
                      {networks[networkId as NetworkId]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem
              onClick={() => {
                resetState("mtst");
                router.push("/accounts");
              }}
            >
              New testnet sandbox
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                resetState("mlcl");
                router.push("/accounts");
              }}
            >
              New local sandbox
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={() => loadTutorial("transfer-assets-between-wallets")}
            >
              Load tutorial
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            {/* <DropdownMenuSub>
              <DropdownMenuSubTrigger>Projects</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => saveProject()}>
                    Save project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadProject()}>
                    Load project
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub> */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tutorials</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {tutorials.map((tutorial) => (
                    <DropdownMenuItem
                      key={tutorial.id}
                      onClick={async () => {
                        startTutorial(tutorial.id);
                        //await sleep(2000);
                        //loadTutorial(tutorial.id);
                        /*sleep(2000).then(() => {
                          loadTutorial(tutorial.id);
                        });*/
                      }}
                    >
                      {tutorial.number}. {tutorial.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default ProjectSwitcher;
