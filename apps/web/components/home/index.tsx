import { type HomeCards, HomeView } from "@/components/home/home-view";
import LaunchExampleCard from "@/components/home/launch-example-card";
import NewSandboxCard from "@/components/home/new-sandbox-card";
import StartTutorialCard from "@/components/home/start-tutorial-card";

// The home page with its live cards. The app shell renders `HomeView` alone
// (the card views, actions disabled) before the Miden client is ready.
const cards: HomeCards = {
  TutorialCard: StartTutorialCard,
  ExampleCard: LaunchExampleCard,
  SandboxCard: NewSandboxCard,
};

const Home = () => <HomeView cards={cards} />;

export default Home;
