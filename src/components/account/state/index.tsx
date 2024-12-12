'use client';

import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { useMiden } from '@/lib/context-providers';

export function AccountState() {
	const { selectedAccount } = useMiden();

	return (
		<div className="h-full border-t border-neutral-200 p-2">
			<Table>
				{selectedAccount.assets.length <= 0 && (
					<TableCaption>No assets found. Consume a note.</TableCaption>
				)}
				<TableHeader>
					<TableRow>
						<TableHead className="w-44">Asset Type</TableHead>
						<TableHead className="w-40%">Faucet</TableHead>
						<TableHead className="">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{selectedAccount.assets.map((asset) => (
						<TableRow key={asset.faucetId}>
							<TableCell className="font-medium">Fungible Asset</TableCell>
							<TableCell>{asset.faucetIdHex}</TableCell>
							<TableCell className="">{asset.amount}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
