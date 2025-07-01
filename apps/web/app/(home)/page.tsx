import { type Metadata } from "next";
import Home from "@/components/home";

export const metadata: Metadata = {
  title: "Miden Playground",
  description: "Miden Playground",
};

const HomePage = () => <Home />;

export default HomePage;
