"use client";
import { Button } from "@workspace/ui/components/button";
import Image from "next/image";
import { useState } from "react";
import LaunchExampleCard from "@/components/home/launch-example-card";
import NewSandboxCard from "@/components/home/new-sandbox-card";
import StartTutorialCard from "@/components/home/start-tutorial-card";
import tutorials from "@/components/tutorials";
import examples from "@/lib/examples";

const SectionHeading = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div>
    <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
      {title}
      <span className="bg-primary size-2 inline-block ml-1" />
    </h3>
    <p className="text-muted-foreground text-lg">{description}</p>
  </div>
);

const SectionSeparator = () => (
  <div className="h-px border-b border-primary border-dashed my-4" />
);

const Tutorials = () => {
  const [showMore, setShowMore] = useState(tutorials.length < 5);
  return (
    <>
      <SectionHeading
        title="Tutorials"
        description="Discover Miden architecture through a series of interactive tutorials."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {tutorials.slice(0, showMore ? tutorials.length : 4).map((tutorial) => (
          <StartTutorialCard key={tutorial.id} tutorial={tutorial} />
        ))}
      </div>
      {!showMore && (
        <Button size="lg" onClick={() => setShowMore(true)}>
          Show all {tutorials.length} tutorials
        </Button>
      )}
    </>
  );
};

const Examples = () => (
  <>
    <SectionHeading
      title="Examples"
      description="Get started with Miden by exploring project templates."
    />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {examples.map((example) => (
        <LaunchExampleCard key={example.id} example={example} />
      ))}
    </div>
  </>
);

const SandboxEnvironments = () => (
  <>
    <SectionHeading
      title="Sandbox environments"
      description="Start building with Miden using a full-featured sandbox environment within your browser."
    />
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
    {/* The hero artwork is transparent and drawn for a white backdrop, so it
    stays white in dark mode instead of following the theme. */}
    <div className="bg-white bg-[url(/img/miden-playground-hero-bg.png)] bg-center flex items-end justify-center h-48">
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
    <div className="h-px border-b border-dashed" />
    <Tutorials />
    <SectionSeparator />
    <Examples />
    <SectionSeparator />
    <SandboxEnvironments />
  </div>
);

export default Home;
