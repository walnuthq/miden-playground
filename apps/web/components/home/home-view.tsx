import { Button } from "@workspace/ui/components/button";
import { type FunctionComponent, useState } from "react";
import useGlobalContext from "@/components/global-context/hook";
import { LaunchExampleCardView } from "@/components/home/launch-example-card-view";
import { NewSandboxCardView } from "@/components/home/new-sandbox-card-view";
import { StartTutorialCardView } from "@/components/home/start-tutorial-card-view";
import { tutorialMetas } from "@/components/tutorials/meta";
import { exampleMetas } from "@/lib/examples/meta";
import type { ExampleMeta } from "@/lib/types/example";
import type { NetworkId } from "@/lib/types/network";
import type { TutorialMeta } from "@/lib/types/tutorial";
import { tutorialStatus } from "@/lib/utils/tutorial-status";

export type HomeCards = {
  TutorialCard: FunctionComponent<{ tutorial: TutorialMeta }>;
  ExampleCard: FunctionComponent<{ example: ExampleMeta }>;
  SandboxCard: FunctionComponent<{ networkId: NetworkId }>;
};

// The app shell's tutorial card: the view alone, with the progress from the
// app state and no handler, so its buttons are disabled.
const PendingTutorialCard = ({ tutorial }: { tutorial: TutorialMeta }) => {
  const state = useGlobalContext();
  return (
    <StartTutorialCardView
      tutorial={tutorial}
      status={tutorialStatus(state, tutorial.id)}
      completed={state.completedTutorials.has(tutorial.id)}
    />
  );
};

const pendingCards: HomeCards = {
  TutorialCard: PendingTutorialCard,
  ExampleCard: LaunchExampleCardView,
  SandboxCard: NewSandboxCardView,
};

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

const Tutorials = ({
  pending,
  TutorialCard,
}: {
  pending: boolean;
  TutorialCard: HomeCards["TutorialCard"];
}) => {
  const [showMore, setShowMore] = useState(tutorialMetas.length < 5);
  return (
    <>
      <SectionHeading
        title="Tutorials"
        description="Discover Miden architecture through a series of interactive tutorials."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {tutorialMetas
          .slice(0, showMore ? tutorialMetas.length : 4)
          .map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
      </div>
      {!showMore && (
        // Disabled while pending: the list it opens is the shell's, replaced
        // by a collapsed one once the client is ready.
        <Button size="lg" disabled={pending} onClick={() => setShowMore(true)}>
          Show all {tutorialMetas.length} tutorials
        </Button>
      )}
    </>
  );
};

const Examples = ({
  ExampleCard,
}: {
  ExampleCard: HomeCards["ExampleCard"];
}) => (
  <>
    <SectionHeading
      title="Examples"
      description="Get started with Miden by exploring project templates."
    />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {exampleMetas.map((example) => (
        <ExampleCard key={example.id} example={example} />
      ))}
    </div>
  </>
);

const SandboxEnvironments = ({
  SandboxCard,
}: {
  SandboxCard: HomeCards["SandboxCard"];
}) => (
  <>
    <SectionHeading
      title="Sandbox environments"
      description="Start building with Miden using a full-featured sandbox environment within your browser."
    />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SandboxCard networkId="mtst" />
      <SandboxCard networkId="mm" />
      {/* <SandboxCard networkId="mdev" /> */}
      {/* <SandboxCard networkId="mmck" /> */}
      {/* import.meta.env.DEV && (
        <SandboxCard networkId="mlcl" />
      )*/}
    </div>
  </>
);

// The home page, from the tutorials' and the examples' metadata. With `cards`
// it is the app's (Home passes the containers); without, the app shell's:
// the card views alone, from the app state, every action disabled until the
// Miden client is ready. This module stays SDK-free: the shell renders it
// before the SDK loads.
export const HomeView = ({ cards }: { cards?: HomeCards }) => {
  const pending = cards === undefined;
  const { TutorialCard, ExampleCard, SandboxCard } = cards ?? pendingCards;
  return (
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
      <Tutorials pending={pending} TutorialCard={TutorialCard} />
      <SectionSeparator />
      <Examples ExampleCard={ExampleCard} />
      <SectionSeparator />
      <SandboxEnvironments SandboxCard={SandboxCard} />
    </div>
  );
};
