import { Heart, MessagesSquare } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/sidebar";

const Footer = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        className="cursor-pointer"
        size="lg"
        asChild
        onClick={() =>
          window.open("https://t.me/BuildOnMiden/55370", "_blank", "noreferrer")
        }
      >
        <div>
          <div className="bg-[#f50] text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <MessagesSquare className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">Share your feedback!</span>
            <small className="text-xs leading-none font-medium flex items-center gap-1">
              Made with <Heart className="size-4" /> by{" "}
              <a
                href="https://walnut.dev/"
                className="text-primary font-medium underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Walnut
              </a>
            </small>
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);

export default Footer;
