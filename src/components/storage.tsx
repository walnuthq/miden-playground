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
import { Account } from '@/lib/account';
import { ScrollArea } from './ui/scroll-area';

export function Storage({ accountId, className }: { accountId?: string; className?: string }) {
	const { accounts, files, accountStorageDiffs } = useMiden();

	const account = accountId ? accounts[accountId] : null;
	const editableStorage = account?.storageFileId
		? Account.parseStorage(files[account?.storageFileId].content.value!)
		: [];

	if (!accountId) return null;

	return editableStorage.length <= 0 ? (
		'No assets'
	) : (
		<ScrollArea className={cn('rounded-theme border border-theme-border w-fit h-48', className)}>
			<Table className="[&_tr:hover]:bg-transparent ">
				<TableHeader>
					<TableRow>
						<TableHead className="pr-4">Index</TableHead>
						<TableHead className="pr-4">Value</TableHead>
						<TableHead className="pr-4">Old value</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{editableStorage.length ? (
						editableStorage.map((item, index) =>
							Array.from(item).map((value, subIndex) => (
								<TableRow key={`${index}-${subIndex}`}>
									<TableCell className="pr-8 last:p-2">{subIndex === 0 ? index : ''}</TableCell>
									<TableCell className="pr-8 last:p-2">{String(value)}</TableCell>
									<TableCell className="pr-8 last:p-2 font-mono text-theme-danger">
										{accountStorageDiffs[index] && accountStorageDiffs[index]?.old
											? accountStorageDiffs[index]?.old[subIndex]
											: ''}
									</TableCell>
								</TableRow>
							))
						)
					) : (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</ScrollArea>
	);
}

{
	/* <TableCell className="pr-8 last:p-2">{index}</TableCell>
								<TableCell className="pr-8 last:p-2">{item[0]}</TableCell> */
}
{
	/* <TableCell className="pr-8 last:p-2">{asset.symbol}</TableCell> */
}
{
	/* <TableCell className="pr-8 last:p-2 flex flex-row font-mono">
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
													{accountUpdates.assetsDelta[asset.faucetId.toString()] > 0 ? '+' : '-'}
													{accountUpdates.assetsDelta[asset.faucetId.toString()]}
												</span>
											)}
									</div>
								</TableCell> */
}
