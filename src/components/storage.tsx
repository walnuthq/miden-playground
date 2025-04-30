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

export function Storage({
	accountId,
	className,
	withoutOldValue = false
}: {
	accountId: string | null;
	className?: string;
	withoutOldValue?: boolean;
}) {
	const { accounts, files, accountStorageDiffs, handleChangeStorage, createNewStorageSlot } =
		useMiden();

	const account = accountId ? accounts[accountId] : null;
	const editableStorage = account?.storageFileId
		? Account.parseStorage(files[account?.storageFileId].content.value!)
		: [];

	if (!accountId) return null;

	return (
		<div className="w-fit ">
			{editableStorage.length > 0 && (
				<ScrollArea className={cn('rounded-theme border border-theme-border h-48', className)}>
					<Table className="[&_tr:hover]:bg-transparent ">
						<TableHeader>
							<TableRow>
								<TableHead className="pr-4">Component</TableHead>
								<TableHead className="pr-4">Index</TableHead>
								<TableHead className="pr-4">Value</TableHead>
								{!withoutOldValue && <TableHead className="pr-4">Old value</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{editableStorage.length ? (
								editableStorage.map((item, index) =>
									Array.from(item).map((value, subIndex) => (
										<TableRow key={`${index}-${subIndex}`}>
											<TableCell className="pr-8 last:py-2 last:pl-2 last:pr-6">
												{index === 0 && account?.isAuth && subIndex === 0
													? 'Auth'
													: (index === 0 || index === 1) && subIndex === 0
													? 'Custom'
													: ''}
											</TableCell>
											<TableCell className="pr-8 last:py-2 last:pl-2 last:pr-6">
												{subIndex === 0 ? index : ''}
											</TableCell>
											<TableCell className="last:py-2 last:pl-2 ">
												<input
													type="number"
													value={String(value)}
													onChange={(e) =>
														handleChangeStorage(account!.id.id, e.target.value, index, subIndex)
													}
													className="bg-transparent outline-none"
												/>
											</TableCell>
											{!withoutOldValue && (
												<TableCell className="pr-8 last:py-2 last:pl-2 last:pr-6 font-mono text-theme-danger">
													{accountStorageDiffs[index] && accountStorageDiffs[index]?.old
														? accountStorageDiffs[index]?.old[subIndex]
														: ''}
												</TableCell>
											)}
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
			)}

			<button
				onClick={() => {
					createNewStorageSlot(account!.id.id);
				}}
				className="w-full mt-2 rounded-theme text-sm text-center transition-all px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border"
			>
				Create slot
			</button>
		</div>
	);
}
