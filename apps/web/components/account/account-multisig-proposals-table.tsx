import type {
  Proposal,
  ProposalMetadata,
} from "@openzeppelin/miden-multisig-client";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useAccounts from "@/hooks/use-accounts";
import useMultisig from "@/hooks/use-multisig";
import type { Account } from "@/lib/types/account";
import { formatDigest } from "@/lib/utils";
import { formatAmount } from "@/lib/utils/asset";

const ProposalActionsCell = ({
  account,
  proposal,
}: {
  account: Account;
  proposal: Proposal;
}) => {
  const { loadMultisig, signProposal, executeProposal } = useMultisig();
  const [loading, setLoading] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="size-8 p-0" disabled={loading} />
        }
      >
        <span className="sr-only">{loading ? "Loading" : "Open menu"}</span>
        {loading ? <Spinner /> : <MoreVertical className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto" align="end">
        {proposal.status === "pending" && (
          <DropdownMenuItem
            onClick={async () => {
              setLoading(true);
              try {
                const multisig = await loadMultisig(account.id);
                if (!multisig) {
                  return;
                }
                await signProposal({ multisig, proposal });
              } catch (error) {
                console.error(error);
                toast.error("Transaction failed.", {
                  description:
                    error instanceof Error ? error.message : String(error),
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            Sign proposal
          </DropdownMenuItem>
        )}
        {proposal.status === "ready" && (
          <DropdownMenuItem
            onClick={async () => {
              setLoading(true);
              try {
                const multisig = await loadMultisig(account.id);
                if (!multisig) {
                  return;
                }
                await executeProposal({ multisig, proposal });
              } catch (error) {
                console.error(error);
                toast.error("Transaction failed.", {
                  description:
                    error instanceof Error ? error.message : String(error),
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            Execute proposal
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AccountMultisigProposalsTable = ({ account }: { account: Account }) => {
  const { faucets, wallets } = useAccounts();
  const { isMultisigSigner } = useMultisig();
  const showProposalActions = isMultisigSigner(account);
  const proposalTypes = {
    update_procedure_threshold: "Update procedure threshold",
    add_signer: "Add signer",
    remove_signer: "Remove signer",
    change_threshold: "Change threshold",
    switch_guardian: "Switch Guardian",
    consume_notes: "Consume notes",
    p2id: "P2ID",
    custom: "Custom",
  } as const;
  const proposalDescription = (metadata: ProposalMetadata) => {
    switch (metadata.proposalType) {
      case "consume_notes": {
        return `Consume ${metadata.noteIds.length} note${metadata.noteIds.length === 1 ? "" : "s"}`;
      }
      case "p2id": {
        const faucet = faucets.find(({ id }) => id === metadata.faucetId);
        const amount = formatAmount({
          amount: metadata.amount,
          decimals: faucet?.decimals,
        });
        const recipient = wallets.find(({ id }) => id === metadata.recipientId);
        return `Send ${amount} ${faucet?.symbol} to ${recipient?.name}`;
      }
      default: {
        return "Custom";
      }
    }
  };
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Commitment</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            {showProposalActions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {account.multisig?.proposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell>{formatDigest(proposal.id)}</TableCell>
              <TableCell>
                {proposalTypes[proposal.metadata.proposalType]}
              </TableCell>
              <TableCell>{proposalDescription(proposal.metadata)}</TableCell>
              <TableCell className="capitalize">
                {proposal.status}{" "}
                {/*proposal.status === "pending" &&
                  `(${proposal.status.signaturesCollected}/${proposal.status.signaturesRequired})`*/}
              </TableCell>
              {showProposalActions && (
                <TableCell>
                  {proposal.status !== "finalized" && (
                    <ProposalActionsCell
                      account={account}
                      proposal={proposal}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountMultisigProposalsTable;
