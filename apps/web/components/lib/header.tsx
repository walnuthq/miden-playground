"use client";
import { usePathname } from "next/navigation";
import { useIsClient } from "usehooks-ts";
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
import TutorialToggle from "@/components/lib/tutorial-toggle";
import ModeToggle from "@/components/lib/mode-toggle";
import useTutorials from "@/hooks/use-tutorials";
import NetworkBadge from "@/components/lib/network-badge";
import useGlobalContext from "@/components/global-context/hook";
import WalletButton from "@/components/lib/wallet-button";

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

const SubLevelPageBreadcrumbs = () => {
  const pathname = usePathname();
  const { href, title } = getLink(pathname);
  const page = getPage(pathname);
  return (
    <>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem className="truncate">
        <BreadcrumbPage className="truncate">{page}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
};

const Header = () => {
  const isClient = useIsClient();
  const { networkId } = useGlobalContext();
  const { tutorialId } = useTutorials();
  const pathname = usePathname();
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
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="truncate">
          <BreadcrumbList>
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
        <div className="ml-auto flex items-center gap-2">
          {isClient && <NetworkBadge />}
          {isClient && tutorialId && <TutorialToggle />}
          <ModeToggle />
          {isClient && networkId === "mtst" && <WalletButton />}
        </div>
      </div>
    </header>
  );
};

export default Header;
