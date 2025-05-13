'use client';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAccounts, useMiden, useNotes } from '@/lib/context-providers';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function Vault({
	noteId,
	accountId,
	className,
	addAssetAbility = false,
	displayDelta = false
}: {
	noteId?: string;
	accountId?: string;
	className?: string;
	displayDelta?: boolean;
	addAssetAbility?: boolean;
}) {
	const { faucets, createFaucet, createNoteFaucet } = useMiden();
	const { accounts, updateAccountAssetAmount, accountUpdates } = useAccounts();
	const { notes, updateNoteAssetAmount } = useNotes();
	const [customAssetName, setCustomAssetName] = useState<string>('');
	const [customAssetAmount, setCustomAssetAmount] = useState<string>('');
	const note = noteId ? notes[noteId] : null;
	const account = accountId ? accounts[accountId] : null;
	const { toast } = useToast();

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
		<div className="code-vault w-fit">
			<div className={cn('rounded-theme border border-theme-border overflow-hidden', className)}>
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
												accountUpdates.assetsDelta[asset.faucetId.toString()]?.toString() !==
													'0' && (
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
						{addAssetAbility && (
							<>
								<TableRow className="">
									<TableCell>
										<input
											value={customAssetName}
											type="string"
											onChange={(e) => {
												setCustomAssetName(e.target.value);
											}}
											placeholder="New asset symbol"
											className="bg-transparent outline-none"
										/>
									</TableCell>
									<TableCell></TableCell>
									<TableCell>
										<input
											value={customAssetAmount}
											onChange={(e) => {
												setCustomAssetAmount(e.target.value);
											}}
											min={0}
											type="number"
											placeholder="New asset amount"
											className="bg-transparent outline-none"
										/>
									</TableCell>
								</TableRow>
							</>
						)}
					</TableBody>
				</Table>
			</div>
			{addAssetAbility && (
				<button
					onClick={() => {
						if (customAssetAmount === '' || customAssetName.trim() === '') {
							toast({
								title: 'Please enter the symbol and amount to create a new asset',
								variant: 'destructive'
							});
						} else if (accountId) {
							createFaucet(customAssetName.trim(), BigInt(customAssetAmount), accountId);
							setCustomAssetAmount('');
							setCustomAssetName('');
						} else if (noteId) {
							createNoteFaucet(customAssetName.trim(), BigInt(customAssetAmount), noteId);
							setCustomAssetAmount('');
							setCustomAssetName('');
						}
					}}
					className="w-full mt-2 rounded-theme text-sm text-center transition-all px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border"
				>
					Create asset
				</button>
			)}
		</div>
	);
}
