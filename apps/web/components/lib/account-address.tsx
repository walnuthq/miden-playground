import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Link } from "react-router";
import CopyButton from "@/components/lib/copy-button";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { formatAddress, getIdentifierPart } from "@/lib/utils/account";

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
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const displayedAccount =
    account ??
    accounts.find(
      (account) => account.id === id || account.address === address,
    );
  if (!displayedAccount) {
    return null;
  }
  const displayedAddress = formatted
    ? formatAddress(displayedAccount.address, networkId)
    : displayedAccount.address;
  // A link styled as a button: Base UI's Button would give it role="button".
  const accountLinkProps = {
    to: `/accounts/${getIdentifierPart(displayedAccount.address)}`,
    className: buttonVariants({
      variant: "link",
      className: "-ml-4 min-w-0 shrink",
    }),
  };
  // In a narrow container (the tutorial panel on a phone) the name is cut
  // short rather than pushing the copy button off screen.
  const label = (
    <span className="truncate">
      {displayedAddress}
      {withName && ` (${displayedAccount.name})`}
    </span>
  );
  const accountAddressContent = withTooltip ? (
    <Tooltip>
      <TooltipTrigger
        render={
          withLink ? (
            <Link {...accountLinkProps} />
          ) : (
            <Button variant="ghost" className="min-w-0 shrink" />
          )
        }
      >
        {label}
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {displayedAccount.address}
          {withName && ` (${displayedAccount.name})`}
        </p>
      </TooltipContent>
    </Tooltip>
  ) : withLink ? (
    <Link {...accountLinkProps}>{label}</Link>
  ) : (
    label
  );
  return withCopyButton ? (
    <div className="flex min-w-0 items-center gap-2">
      {accountAddressContent}
      {withCopyButton && (
        <CopyButton content="Copy Address" copy={displayedAccount.address} />
      )}
    </div>
  ) : (
    accountAddressContent
  );
};

export default AccountAddress;
