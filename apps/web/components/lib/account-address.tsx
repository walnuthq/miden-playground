import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { formatAddress } from "@/lib/utils";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import CopyButton from "@/components/lib/copy-button";

const AccountAddress = ({
  id = "",
  address = "",
  account = undefined,
  formatted = true,
  withLink = true,
  withTooltip = true,
  withCopyButton = true,
  withName = true,
}: {
  id?: string;
  address?: string;
  account?: { name: string; address: string };
  formatted?: boolean;
  withLink?: boolean;
  withTooltip?: boolean;
  withCopyButton?: boolean;
  withName?: boolean;
}) => {
  const { networkId } = useGlobalContext();
  const { accounts } = useAccounts();
  const displayedAccount =
    account ??
    accounts.find(
      (account) => account.id === id || account.address === address
    );
  if (!displayedAccount) {
    return null;
  }
  const displayedAddress = formatted
    ? formatAddress(displayedAccount.address, networkId)
    : displayedAccount.address;
  const accountAddressContent = withTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {withLink ? (
          <Link href={`/accounts/${displayedAccount.address}`}>
            <Button className="cursor-pointer -ml-4" variant="link">
              {displayedAddress}
              {withName && ` (${displayedAccount.name})`}
            </Button>
          </Link>
        ) : (
          <Button variant="ghost">
            {displayedAddress}
            {withName && ` (${displayedAccount.name})`}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {displayedAccount.address} ({displayedAccount.name})
        </p>
      </TooltipContent>
    </Tooltip>
  ) : withLink ? (
    <Link href={`/accounts/${displayedAccount.address}`}>
      <Button className="cursor-pointer -ml-4" variant="link">
        {displayedAddress}
        {withName && ` (${displayedAccount.name})`}
      </Button>
    </Link>
  ) : (
    <span>
      {displayedAddress}
      {withName && ` (${displayedAccount.name})`}
    </span>
  );
  return withCopyButton ? (
    <div className="flex items-center gap-2">
      {accountAddressContent}
      {withCopyButton && (
        <CopyButton content="Copy Account ID" copy={displayedAccount.address} />
      )}
    </div>
  ) : (
    accountAddressContent
  );
};

export default AccountAddress;
