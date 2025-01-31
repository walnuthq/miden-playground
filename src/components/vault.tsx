'use client';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { useMiden } from '@/lib/context-providers';
import { cn } from '@/lib/utils';
import { faucetSymbols } from '@/lib/consts';

export function Vault({
	noteId,
	accountId,
	className
}: {
	noteId?: string;
	accountId?: string;
	className?: string;
}) {
	const { notes, accounts, updateAccountAssetAmount, updateNoteAssetAmount } = useMiden();

	const note = noteId ? notes[noteId] : null;
	const account = accountId ? accounts[accountId] : null;
	const editableAssets = (note?.assets || account?.assets || []).map((asset) => ({
		faucetId: asset.faucetId,
		amount: parseInt(asset.amount.toString()),
		symbol: faucetSymbols[asset.faucetId.toString()],
		type: 'Fungible'
	}));

	const handleAmountChange = (faucetId: bigint, newAmount: string) => {
		const newAmountInt = newAmount ? parseInt(newAmount) : 0;
		if (noteId) {
			updateNoteAssetAmount(noteId, faucetId, () => BigInt(newAmountInt));
		} else if (accountId) {
			updateAccountAssetAmount(accountId, faucetId, () => BigInt(newAmountInt));
		}
	};

	if (!noteId && !accountId) return null;

	return (
		<div className={cn('rounded-theme border border-theme-border w-fit', className)}>
			<Table className="[&_tr:hover]:bg-transparent">
				<TableHeader>
					<TableRow>
						<TableHead className="pr-4">Type</TableHead>
						<TableHead className="pr-4">Faucet ID</TableHead>
						<TableHead className="pr-4">Symbol</TableHead>
						<TableHead className="pr-4">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{editableAssets.length ? (
						editableAssets.map((asset) => (
							<TableRow key={asset.faucetId}>
								<TableCell className="pr-8 last:p-2">{asset.type}</TableCell>
								<TableCell className="pr-8 last:p-2">{asset.faucetId}</TableCell>
								<TableCell className="pr-8 last:p-2">{asset.symbol}</TableCell>
								<TableCell className="pr-8 last:p-2">
									<input
										type="number"
										value={asset.amount}
										onChange={(e) => handleAmountChange(asset.faucetId, e.target.value)}
										className="bg-transparent outline-none w-20"
										min={0}
										maxLength={10}
									/>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
