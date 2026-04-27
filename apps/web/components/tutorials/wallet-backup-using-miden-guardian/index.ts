import type { Tutorial } from "@/lib/types/tutorial";
import { defaultTutorial } from "@/lib/utils/tutorial";
import { defaultState } from "@/lib/utils/state";
import Step1 from "@/components/tutorials/wallet-backup-using-miden-guardian/step1";
import Step2 from "@/components/tutorials/wallet-backup-using-miden-guardian/step2";
import Step3 from "@/components/tutorials/wallet-backup-using-miden-guardian/step3";
import Step4 from "@/components/tutorials/wallet-backup-using-miden-guardian/step4";
import Step5 from "@/components/tutorials/wallet-backup-using-miden-guardian/step5";
import Step6 from "@/components/tutorials/wallet-backup-using-miden-guardian/step6";
import Step7 from "@/components/tutorials/wallet-backup-using-miden-guardian/step7";

const tutorial: Tutorial = {
  ...defaultTutorial(),
  id: "wallet-backup-using-miden-guardian",
  number: 5,
  title: "Wallet backup using Miden Guardian",
  tagline: "Backup your wallet using a Guardian.",
  description:
    "This tutorial teaches you how to backup your private wallet state using Miden Guardian, a system that allows a device, or a group of devices, to backup and sync their state securely without trust assumptions about the server operator.",
  category: "advanced",
  initialRoute: "/accounts",
  state: {
    ...defaultState(),
    tutorialId: "wallet-backup-using-miden-guardian",
  },
  steps: [Step1, Step2, Step3, Step4, Step5, Step6, Step7],
};

export default tutorial;
