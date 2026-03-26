import { type AccountMultisig } from "@/lib/types/account";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";

const AccountMultisigInformationTable = ({
  multisig: {
    config: { /*threshold,*/ signerCommitments, guardianCommitment },
  },
}: {
  multisig: AccountMultisig;
}) => (
  <div className="rounded-md border">
    <Table>
      <TableBody>
        {/* <TableRow>
          <TableCell>Threshold</TableCell>
          <TableCell>{threshold}</TableCell>
        </TableRow> */}
        <TableRow>
          <TableCell>Signer commitments</TableCell>
          <TableCell>
            {signerCommitments.map((signerCommitment) => (
              <p key={signerCommitment}>{signerCommitment}</p>
            ))}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Guardian commitment</TableCell>
          <TableCell>
            <p>{guardianCommitment}</p>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export default AccountMultisigInformationTable;
