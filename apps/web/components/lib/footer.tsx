import { Heart, MessagesSquare } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/sidebar";
import newGithubIssueUrl from "new-github-issue-url";

const Footer = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        className="cursor-pointer"
        size="lg"
        asChild
        onClick={() => {
          const url = newGithubIssueUrl({
            repoUrl: "https://github.com/walnuthq/miden-playground",
            title: "Feedback: ",
            body: "Please describe your feedback here, feel free to include screenshots or any other relevant information.",
            type: "feature",
          });
          window.open(url, "_blank");
        }}
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
                rel="noopener noreferrer"
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
