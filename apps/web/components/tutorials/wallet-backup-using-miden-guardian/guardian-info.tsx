import { useEffect, useState } from "react";
import {
  useWallet,
  type GuardianInfo as WalletGuardianInfo,
  type MidenWalletAdapter,
} from "@miden-sdk/miden-wallet-adapter";
import { Spinner } from "@workspace/ui/components/spinner";

const guardianProviderNames: Record<
  NonNullable<WalletGuardianInfo["guardianProvider"]>,
  string
> = {
  "open-zeppelin": "OpenZeppelin",
  gateway: "Gateway",
  "lambda-class": "LambdaClass",
  custom: "a custom provider",
};

const GuardianInfo = () => {
  const { wallet, connected } = useWallet();
  const [guardianInfo, setGuardianInfo] = useState<WalletGuardianInfo | null>(
    null,
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!wallet || !connected) {
      return;
    }
    const adapter = wallet.adapter as MidenWalletAdapter;
    adapter
      .requestGuardianInfo()
      .then(setGuardianInfo)
      .catch((error) => {
        console.error(error);
        setError(true);
      });
  }, [wallet, connected]);
  if (!connected) {
    return (
      <p>
        Connect Bread Wallet to check whether your account is backed up by Miden
        Guardian.
      </p>
    );
  }
  if (error) {
    return (
      <p>
        Bread Wallet couldn't tell whether your account is backed up by Miden
        Guardian. Make sure your extension is up to date.
      </p>
    );
  }
  if (!guardianInfo) {
    return (
      <p className="flex items-center gap-2">
        <Spinner /> Checking whether your Bread Wallet account is backed up by
        Miden Guardian…
      </p>
    );
  }
  if (!guardianInfo.isGuardianAccount) {
    return (
      <p>
        Your connected Bread Wallet account is <strong>not</strong> backed up by
        Miden Guardian.
      </p>
    );
  }
  const provider = guardianInfo.guardianProvider
    ? guardianProviderNames[guardianInfo.guardianProvider]
    : "an unknown provider";
  return (
    <p>
      Your connected Bread Wallet account is <strong>backed up</strong> by Miden
      Guardian, operated by <strong>{provider}</strong>
      {guardianInfo.guardianProvider === "custom" &&
        guardianInfo.guardianEndpoint && (
          <>
            {" "}
            (<code>{guardianInfo.guardianEndpoint}</code>)
          </>
        )}
      .
    </p>
  );
};

export default GuardianInfo;
