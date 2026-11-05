import { Outlet } from "react-router";
import { AppLayout } from "@/components/lib/app-layout";
import AppSidebar from "@/components/lib/app-sidebar";
import Header from "@/components/lib/header";
import TutorialLayout from "@/components/tutorials/tutorial-layout";

// The app's layout route, loaded lazily (routes.tsx): its sidebar and header
// use the Miden client. The app shell renders `AppLayout` with the SDK-free
// views instead.
const SidebarLayout = () => (
  <AppLayout sidebar={<AppSidebar />}>
    <TutorialLayout>
      <Header />
      <Outlet />
    </TutorialLayout>
  </AppLayout>
);

export default SidebarLayout;
