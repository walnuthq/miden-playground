"use client";
import NewSandboxCard from "@/components/home/new-sandbox-card";
import StartTutorialCard from "@/components/home/start-tutorial-card";
import tutorials from "@/components/tutorials";

const Home = () => (
  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      Welcome to Miden Playground
    </h2>
    <h3 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
      Sandbox environments
    </h3>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <NewSandboxCard networkId="mtst" />
      <NewSandboxCard networkId="mlcl" />
    </div>
    <h3 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
      Tutorials
    </h3>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {tutorials.map((tutorial) => (
        <StartTutorialCard key={tutorial.id} tutorial={tutorial} />
      ))}
    </div>
  </div>
);

export default Home;
