import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { useLocation } from "react-router";
import GithubButton from "@/components/lib/github-button";
import ModeToggle from "@/components/lib/mode-toggle";
import NetworkBadge from "@/components/lib/network-badge";
import TutorialToggle from "@/components/lib/tutorial-toggle";
import WalletButton from "@/components/lib/wallet-button";
import ScriptStatusBadge from "@/components/scripts/script-status-badge";
import useNetwork from "@/hooks/use-network";
import useScript from "@/hooks/use-script";
import useTutorials from "@/hooks/use-tutorials";

const getLink = (pathname: string) => {
  const [, route] = pathname.split("/");
  const links = {
    accounts: { href: "/accounts", title: "Accounts" },
    transactions: { href: "/transactions", title: "Transactions" },
    notes: { href: "/notes", title: "Notes" },
    scripts: { href: "/scripts", title: "Scripts" },
    components: { href: "/components", title: "Components" },
  };
  return links[route as keyof typeof links];
};

const getPage = (pathname: string) => {
  const [, , resource] = pathname.split("/");
  return resource;
};

// A script's page shows its name, not its id (a UUID, or `<example>_<uuid>`
// for the mock API's), then its compile status: a dot while it's a draft,
// edited since its last compile, and a badge. Both sit outside
// `BreadcrumbPage`, whose text is the name alone.
const ScriptBreadcrumb = ({ id }: { id: string }) => {
  const script = useScript(id);
  if (!script) {
    return (
      <BreadcrumbItem className="truncate">
        <BreadcrumbPage className="truncate">{id}</BreadcrumbPage>
      </BreadcrumbItem>
    );
  }
  const { name, status, readOnly } = script;
  return (
    <BreadcrumbItem className="min-w-0">
      <BreadcrumbPage className="truncate">{name}</BreadcrumbPage>
      {status === "draft" && !readOnly && (
        <span
          role="img"
          aria-label="Edited since the last compile"
          title="Edited since the last compile"
          className="size-2 shrink-0 rounded-full bg-foreground/60"
        />
      )}
      {/* On a phone the name needs the room: the status shows in the
          sidebar too. */}
      <ScriptStatusBadge status={status} className="hidden sm:inline-flex" />
    </BreadcrumbItem>
  );
};

const SubLevelPageBreadcrumbs = () => {
  const { pathname } = useLocation();
  // Undefined for unknown paths, which render the not-found page.
  const link = getLink(pathname);
  const page = getPage(pathname);
  return (
    <>
      {link && (
        <>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href={link.href}>{link.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
        </>
      )}
      {link?.href === "/scripts" ? (
        <ScriptBreadcrumb id={page ?? ""} />
      ) : (
        <BreadcrumbItem className="truncate">
          <BreadcrumbPage className="truncate">{page}</BreadcrumbPage>
        </BreadcrumbItem>
      )}
    </>
  );
};

const Header = () => {
  const { networkId } = useNetwork();
  const { tutorialId, isTutorial } = useTutorials();
  const { pathname } = useLocation();
  const isTopLevelPage = [
    "/",
    "/accounts",
    "/transactions",
    "/notes",
    "/scripts",
    "/components",
  ].includes(pathname);
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        {/* The stock vertical separator stretches (`self-stretch`): at `h-4` it
            would sit at the top of the row, not centered like its neighbors. */}
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-center"
        />
        {/* min-w-0: the breadcrumb gives way (truncates) before the buttons
            push the row past a phone's width. */}
        <Breadcrumb className="min-w-0 truncate">
          <BreadcrumbList className="flex-nowrap">
            {isTopLevelPage ? (
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize">
                  {pathname.slice(1) || "home"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <SubLevelPageBreadcrumbs />
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <GithubButton className="hidden md:block" />
          <NetworkBadge />
          <ModeToggle />
          {networkId !== "mmck" && !isTutorial && (
            <WalletButton
              enabledSigners={
                ["private-transfers"].includes(tutorialId)
                  ? ["MidenFi", "Para"]
                  : ["MidenFi"]
              }
            />
          )}
          {tutorialId && <TutorialToggle />}
        </div>
      </div>
    </header>
  );
};

export default Header;
