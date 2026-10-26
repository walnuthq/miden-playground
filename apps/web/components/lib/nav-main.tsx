import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  SidebarGroup,
  // SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

const NavMain = ({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: ReactNode;
    items?: {
      title: string;
      url: string;
      icon?: ReactNode;
      leftIcon?: ReactNode;
    }[];
  }[];
}) => {
  const { pathname } = useLocation();
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.url}
            //defaultOpen={item.items.length > 0}
            defaultOpen
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <SidebarMenuButton
              isActive={
                item.url === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.url)
              }
              render={<Link to={item.url} />}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
            {item.items && item.items.length > 0 && (
              <CollapsibleTrigger render={<SidebarMenuAction />}>
                <ChevronRight className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarMenuSub className="pr-0 mr-0">
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.url}>
                    <SidebarMenuSubButton
                      isActive={pathname === subItem.url}
                      render={
                        <Link
                          to={subItem.url}
                          className="flex items-center justify-between"
                        />
                      }
                    >
                      <div className="flex items-center gap-1">
                        {subItem.icon}
                        <span>{subItem.title}</span>
                      </div>
                      {subItem.leftIcon}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavMain;
