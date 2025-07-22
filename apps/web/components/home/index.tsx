"use client";
import NewEmptyProjectCard from "@/components/home/new-empty-project-card";
import StartTutorialCard from "@/components/home/start-tutorial-card";
import tutorials from "@/components/tutorials/tutorials";

const Home = () => (
  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      Welcome to Miden Playground
    </h2>
    <div className="grid grid-cols-3 gap-4">
      <NewEmptyProjectCard />
      {tutorials.map((tutorial) => (
        <StartTutorialCard key={tutorial.id} tutorial={tutorial} />
      ))}
    </div>
  </div>
);

export default Home;
