import { type Metadata } from "next";
import Home from "@/components/home";

const metadataBase = "https://playground.miden.xyz";

export const metadata: Metadata = {
  metadataBase,
  title: "Miden Playground",
  description:
    "Experiment with Miden's novel architecture in our very own training environment.",
  openGraph: {
    url: metadataBase,
    type: "website",
    images: [`${metadataBase}/opengraph-image.jpg`],
    locale: "en_US",
    siteName: "Miden Playground",
  },
  twitter: {
    images: [`${metadataBase}/twitter-image.jpg`],
  },
};

const HomePage = () => <Home />;

export default HomePage;
