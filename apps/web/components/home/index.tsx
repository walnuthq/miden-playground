"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import StartTutorialCard from "@/components/home/start-tutorial-card";
import tutorials from "@/components/tutorials";
import examples from "@/components/home/examples";
import LaunchExampleCard from "@/components/home/launch-example-card";
import NewSandboxCard from "@/components/home/new-sandbox-card";

const Tutorials = () => {
  const [showMore, setShowMore] = useState(false);
  return (
    <>
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
        {tutorials.slice(0, showMore ? tutorials.length : 4).map((tutorial) => (
          <StartTutorialCard key={tutorial.id} tutorial={tutorial} />
        ))}
      </div>
      {!showMore && (
        <Button
          size="lg"
          className="bg-[#ff5500]"
          onClick={() => setShowMore(true)}
        >
          Show all {tutorials.length} tutorials
        </Button>
      )}
    </>
  );
};

const Examples = () => (
  <>
    <div>
      <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
        Examples
        <div className="bg-[#ff5500] size-2 inline-block ml-1" />
      </h3>
      <p className="text-black/60 text-lg">
        Get started with Miden by exploring project templates.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {examples.map((example) => (
        <LaunchExampleCard key={example.id} example={example} />
      ))}
    </div>
  </>
);

const SandboxEnvironments = () => (
  <>
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
      {/* <NewSandboxCard networkId="mdev" /> */}
      {/* <NewSandboxCard networkId="mmck" /> */}
      {/* process.env.NODE_ENV === "development" && (
        <NewSandboxCard networkId="mlcl" />
      )*/}
    </div>
  </>
);

const Home = () => (
  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
    <div className="bg-[url(/img/miden-playground-hero-bg.png)] bg-center flex items-end justify-center h-48">
      <Image
        className="-mb-px"
        src="/img/miden-playground-hero-text.svg"
        alt="Miden Playground Hero Text"
        width={255}
        height={45}
      />
    </div>
    <p className="text-xl">
      <strong>Welcome!</strong> Experiment with Miden's novel architecture in
      our very own training environment.
    </p>
    <div className="h-px border-b border-black/20 border-dashed" />
    <Tutorials />
    <div className="h-px border-b border-[#ff5500] border-dashed my-4" />
    <Examples />
    <div className="h-px border-b border-[#ff5500] border-dashed my-4" />
    <SandboxEnvironments />
  </div>
);

export default Home;
