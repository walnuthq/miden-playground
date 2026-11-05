import GithubButton from "@/components/lib/github-button";
import { HeaderView } from "@/components/lib/header-view";
import ModeToggle from "@/components/lib/mode-toggle";
import NetworkBadge from "@/components/lib/network-badge";
import TutorialToggle from "@/components/lib/tutorial-toggle";
import WalletButton from "@/components/lib/wallet-button";
import useNetwork from "@/hooks/use-network";
import useTutorials from "@/hooks/use-tutorials";

// The app's header: `HeaderView` (SDK-free, the app shell's too) with the
// live network badge, the wallet button and the tutorial toggle.
const Header = () => {
  const { networkId } = useNetwork();
  const { tutorialId, isTutorial } = useTutorials();
  return (
    <HeaderView
      actions={
        <>
          <GithubButton className="hidden md:block" />
          <NetworkBadge />
          <ModeToggle />
          {networkId !== "mmck" && !isTutorial && (
            <WalletButton
              enabledSigners={
                ["private-transfers"].includes(tutorialId)
                  ? ["MidenFi", "Para"]
                  : ["MidenFi"]
              }
            />
          )}
          {tutorialId && <TutorialToggle />}
        </>
      }
    />
  );
};

export default Header;
