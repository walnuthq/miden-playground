import { type Metadata } from "next";
import Home from "@/components/home";

export const metadata: Metadata = {
  title: "Miden Playground",
  description:
    "Experiment with Miden's novel architecture in our very own training environment.",
};

const HomePage = () => <Home />;

export default HomePage;
