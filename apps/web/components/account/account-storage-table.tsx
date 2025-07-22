import { type AccountStorage } from "@workspace/mock-web-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

const storageItems = (storage: AccountStorage) => {
  const MAX_NUM_STORAGE_SLOTS = 255;
  const result = [];
  for (let index = 0; index < MAX_NUM_STORAGE_SLOTS; index++) {
    const item = storage.getItem(index);
    if (item) {
      result.push(item);
    } else {
      break;
    }
  }
  return result;
};

const AccountStorageTable = ({ storage }: { storage: AccountStorage }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Slot Index</TableHead>
          <TableHead>Item Slot Type</TableHead>
          <TableHead>Value/Commitment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {storageItems(storage).map((item, index) => (
          <TableRow key={index}>
            <TableCell>{index}</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>{item.toHex()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default AccountStorageTable;
