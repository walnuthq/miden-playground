import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import useGlobalContext from "@/components/global-context/hook";
import LaunchExampleCard, {
  LaunchExampleCardView,
} from "@/components/home/launch-example-card";
import NewSandboxCard, {
  NewSandboxCardView,
} from "@/components/home/new-sandbox-card";
import StartTutorialCard, {
  StartTutorialCardView,
} from "@/components/home/start-tutorial-card";
import tutorials from "@/components/tutorials";
import examples from "@/lib/examples";
import { tutorialStatus } from "@/lib/utils/tutorial-status";

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

const Tutorials = ({ pending }: { pending: boolean }) => {
  const globalState = useGlobalContext();
  const [showMore, setShowMore] = useState(tutorials.length < 5);
  return (
    <>
      <SectionHeading
        title="Tutorials"
        description="Discover Miden architecture through a series of interactive tutorials."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {tutorials
          .slice(0, showMore ? tutorials.length : 4)
          .map((tutorial) =>
            pending ? (
              <StartTutorialCardView
                key={tutorial.id}
                tutorial={tutorial}
                status={tutorialStatus(globalState, tutorial.id)}
                completed={globalState.completedTutorials.has(tutorial.id)}
              />
            ) : (
              <StartTutorialCard key={tutorial.id} tutorial={tutorial} />
            ),
          )}
      </div>
      {!showMore && (
        // Disabled while pending: the list it opens is the shell's, replaced
        // by a collapsed one once the client is ready.
        <Button size="lg" disabled={pending} onClick={() => setShowMore(true)}>
          Show all {tutorials.length} tutorials
        </Button>
      )}
    </>
  );
};

const Examples = ({ pending }: { pending: boolean }) => (
  <>
    <SectionHeading
      title="Examples"
      description="Get started with Miden by exploring project templates."
    />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {examples.map((example) =>
        pending ? (
          <LaunchExampleCardView key={example.id} example={example} />
        ) : (
          <LaunchExampleCard key={example.id} example={example} />
        ),
      )}
    </div>
  </>
);

const SandboxEnvironments = ({ pending }: { pending: boolean }) => {
  const Card = pending ? NewSandboxCardView : NewSandboxCard;
  return (
    <>
      <SectionHeading
        title="Sandbox environments"
        description="Start building with Miden using a full-featured sandbox environment within your browser."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card networkId="mtst" />
        <Card networkId="mm" />
        {/* <Card networkId="mdev" /> */}
        {/* <Card networkId="mmck" /> */}
        {/* import.meta.env.DEV && (
        <NewSandboxCard networkId="mlcl" />
      )*/}
      </div>
    </>
  );
};

// `pending` while the Miden client initializes: the app shell shows the page
// with every action disabled, from the app state alone.
const Home = ({ pending = false }: { pending?: boolean }) => (
  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
    {/* The hero artwork is transparent and drawn for a white backdrop, so it
    stays white in dark mode instead of following the theme. */}
    <div className="bg-white bg-[url(/img/miden-playground-hero-bg.png)] bg-center flex items-end justify-center h-48">
      <img
        className="-mb-px"
        src="/img/miden-playground-hero-text.svg"
        alt="Miden Playground Hero Text"
        width={255}
        height={45}
        loading="lazy"
      />
    </div>
    <p className="text-xl">
      <strong>Welcome!</strong> Experiment with Miden's novel architecture in
      our very own training environment.
    </p>
    <div className="h-px border-b border-dashed" />
    <Tutorials pending={pending} />
    <SectionSeparator />
    <Examples pending={pending} />
    <SectionSeparator />
    <SandboxEnvironments pending={pending} />
  </div>
);

export default Home;
