"use client";
import Image from "next/image";
import NewSandboxCard from "@/components/home/new-sandbox-card";
import StartTutorialCard from "@/components/home/start-tutorial-card";
import tutorials from "@/components/tutorials";

const Home = () => (
  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
    <div className="bg-[url(/img/miden-playground-hero-bg.png)] bg-center flex items-end justify-center h-48">
      <Image
        src="/img/miden-playground-hero-text.png"
        alt="Miden Playground Hero Text"
        width={285}
        height={50}
      />
    </div>
    <p className="text-xl">
      <strong>Welcome!</strong> Experiment with Miden's novel architecture in
      our very own training environment.
    </p>
    <div className="h-px border-b border-black/20 border-dashed" />
    <div>
      <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
        Tutorials
        <div className="bg-[#ff5500] size-2 inline-block ml-1" />
      </h3>
      <p className="text-black/60 text-lg">
        Discover Miden architecture through a series of interactive tutorials.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {tutorials.map((tutorial) => (
        <StartTutorialCard key={tutorial.id} tutorial={tutorial} />
      ))}
    </div>
    <div className="h-px border-b border-[#ff5500] border-dashed my-4" />
    <div>
      <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
        Sandbox environments
        <div className="bg-[#ff5500] size-2 inline-block ml-1" />
      </h3>
      <p className="text-black/60 text-lg">
        Start building with Miden using a full-featured sandbox environment
        within your browser.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <NewSandboxCard networkId="mtst" />
      {/*<NewSandboxCard networkId="mdev" />*/}
      <NewSandboxCard networkId="mmck" />
      {process.env.NODE_ENV === "development" && (
        <NewSandboxCard networkId="mlcl" />
      )}
    </div>
  </div>
);

export default Home;
