'use client';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
// import { faucets } from '@/lib/consts';
import { useMiden } from '@/lib/context-providers';
import { cn } from '@/lib/utils';
// import { faucetSymbols } from '@/lib/consts';

export function Vault({
	noteId,
	accountId,
	className,
	displayDelta = false
}: {
	noteId?: string;
	accountId?: string;
	className?: string;
	displayDelta?: boolean;
}) {
	const {
		notes,
		accounts,
		updateAccountAssetAmount,
		updateNoteAssetAmount,
		accountUpdates,
		faucets
	} = useMiden();

	const note = noteId ? notes[noteId] : null;
	const account = accountId ? accounts[accountId] : null;
	const editableAssets = (note?.assets || account?.assets || []).map((asset) => ({
		faucetId: asset.faucetId,
		amount: parseInt(asset.amount.toString()),
		symbol: faucets[asset.faucetId.toString()],
		type: 'Fungible'
	}));

	const handleAmountChange = (faucetId: string, newAmount: string) => {
		const newAmountInt = newAmount ? parseInt(newAmount) : 0;
		if (noteId) {
			updateNoteAssetAmount(noteId, faucetId, () => BigInt(newAmountInt));
		} else if (accountId) {
			updateAccountAssetAmount(accountId, faucetId, () => BigInt(newAmountInt));
		}
	};

	if (!noteId && !accountId) return null;

	return editableAssets.length <= 0 ? (
		'No assets'
	) : (
		<div className={cn('rounded-theme border border-theme-border w-fit', className)}>
			<Table className="[&_tr:hover]:bg-transparent">
				<TableHeader>
					<TableRow>
						<TableHead className="pr-4">Symbol</TableHead>
						<TableHead className="pr-4">Faucet ID</TableHead>
						<TableHead className="pr-4">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{editableAssets.length ? (
						editableAssets.map((asset) => (
							<TableRow key={asset.faucetId}>
								<TableCell className="pr-8 last:p-2">{asset.symbol}</TableCell>
								<TableCell className="pr-8 last:p-2">{asset.faucetId}</TableCell>
								<TableCell className="pr-8 last:p-2 flex flex-row font-mono">
									<input
										type="number"
										value={asset.amount}
										onChange={(e) => handleAmountChange(asset.faucetId, e.target.value)}
										className="bg-transparent outline-none w-20"
										min={0}
										maxLength={10}
									/>
									<div className="min-w-8">
										{displayDelta &&
											accountUpdates &&
											accountUpdates.accountId === accountId &&
											accountUpdates.assetsDelta[asset.faucetId.toString()].toString() !== '0' && (
												<span
													className={`text-sm text-muted-foreground ${
														accountUpdates.assetsDelta[asset.faucetId.toString()] > 0
															? 'text-theme-success'
															: 'text-theme-danger'
													}`}
												>
													{accountUpdates.assetsDelta[asset.faucetId.toString()] > 0 ? '+' : ''}
													{accountUpdates.assetsDelta[asset.faucetId.toString()]}
												</span>
											)}
									</div>
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
