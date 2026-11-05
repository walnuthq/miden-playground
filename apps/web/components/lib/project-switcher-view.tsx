import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { ChevronsUpDown } from "lucide-react";
import Logo from "@/components/lib/logo";
import { tutorialMetas } from "@/components/tutorials/meta";
import { exampleMetas } from "@/lib/examples/meta";
import { type NetworkId, networks } from "@/lib/types/network";

// The project shown under "Miden Playground": the saved project's name, else
// the tutorial, the example, or the network's sandbox. From the tutorials' and
// examples' metadata, not the tutorials and examples themselves (whose steps
// and states need the SDK): the app shell shows it before the SDK loads.
export const projectTitle = ({
  projectName,
  tutorialId,
  exampleId,
  networkId,
}: {
  projectName: string;
  tutorialId: string;
  exampleId: string;
  networkId: NetworkId;
}) =>
  projectName ||
  (tutorialMetas.find(({ id }) => id === tutorialId)?.title ??
    exampleMetas.find(({ id }) => id === exampleId)?.title ??
    `${networks[networkId]} sandbox`);

export const ProjectSwitcherButtonContent = ({ title }: { title: string }) => (
  <>
    <div className="bg-background border flex aspect-square size-8 items-center justify-center rounded-lg">
      <Logo className="size-6" />
    </div>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">Miden Playground</span>
      <span className="truncate text-xs">{title}</span>
    </div>
    <ChevronsUpDown className="ml-auto" />
  </>
);

// The switcher's button alone, without its menu, for the app shell: the
// menu's actions need the Miden client (ProjectSwitcher, the container).
export const ProjectSwitcherView = ({ title }: { title: string }) => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg">
        <ProjectSwitcherButtonContent title={title} />
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);
