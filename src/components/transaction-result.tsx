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

export function TransactionResult() {
	const { selectedTransaction } = useMiden();

	return (
		<div className="overflow-hidden">
			<div className="bg-blue-miden text-white px-2 py-1">Transaction info</div>
			<Table className="text-white">
				<TableHeader>
					<TableRow>
						<TableHead className="border-b border-dark-miden-700 border-r">Prgoram hash</TableHead>
						<TableHead className="border-b border-dark-miden-700 border-r">Cycles</TableHead>
						<TableHead className="border-b border-dark-miden-700">Trace length</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="border-b border-dark-miden-700 border-r"></TableCell>
						<TableCell className="border-b border-dark-miden-700 border-r"></TableCell>
						<TableCell className="border-b border-dark-miden-700"></TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<div className="bg-blue-miden text-white px-2 py-1">Account info</div>
			<Table className="text-white">
				<TableHeader>
					<TableRow>
						<TableHead className="border-b border-dark-miden-700 border-r">Account ID</TableHead>
						<TableHead className="border-b border-dark-miden-700 border-r">Account Hash</TableHead>
						<TableHead className="border-b border-dark-miden-700 border-r">Type</TableHead>
						<TableHead className="border-b border-dark-miden-700">Storage Mode</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="border-b border-dark-miden-700 border-r">
							{selectedTransaction?.accounts[0].id}
						</TableCell>
						<TableCell className="border-b border-dark-miden-700 border-r">
							{selectedTransaction?.result?.accountHash?.substring(0, 10)}
						</TableCell>
						<TableCell className="border-b border-dark-miden-700 border-r"></TableCell>
						<TableCell className="border-b border-dark-miden-700"></TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<Table className="text-white">
				<TableHeader>
					<TableRow>
						<TableHead className="border-b border-dark-miden-700 border-r">
							Code commitment
						</TableHead>
						<TableHead className="border-b border-dark-miden-700 border-r">Vault root</TableHead>
						<TableHead className="border-b border-dark-miden-700 border-r">Storage root</TableHead>
						<TableHead className="border-b border-dark-miden-700">Nonce</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="border-b border-dark-miden-700 border-r">
							{selectedTransaction?.result?.codeCommitment?.substring(0, 10)}
						</TableCell>
						<TableCell className="border-b border-dark-miden-700 border-r">
							{selectedTransaction?.result?.vaultRoot?.substring(0, 10)}
						</TableCell>
						<TableCell className="border-b border-dark-miden-700 border-r">
							{selectedTransaction?.result?.storageCommitment?.substring(0, 10)}
						</TableCell>
						<TableCell className="border-b border-dark-miden-700">
							{selectedTransaction?.result?.nonce?.toString().substring(0, 10)}
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<div className="bg-blue-miden text-white px-2 py-1">Asset info</div>
			<Table className="text-white">
				<TableHeader>
					<TableRow>
						<TableHead className="border-b border-dark-miden-700 border-r">Asset Type</TableHead>
						<TableHead className="border-b border-dark-miden-700 border-r">Faucet ID</TableHead>
						<TableHead className="border-b border-dark-miden-700">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{selectedTransaction?.result?.assets.map((asset) => (
						<TableRow key={asset.faucetId}>
							<TableCell className="border-b border-dark-miden-700 border-r">
								Fungible Asset
							</TableCell>
							<TableCell className="border-b border-dark-miden-700 border-r">
								{asset.faucetIdHex}
							</TableCell>
							<TableCell className="border-b border-dark-miden-700">{asset.amount}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<div className="bg-blue-miden text-white px-2 py-1">Storage info</div>
			<Table className="text-white">
				<TableHeader>
					<TableRow>
						<TableHead className="border-b border-dark-miden-700 border-r">Slot index</TableHead>
						<TableHead className="border-b border-dark-miden-700 border-r">Slot type</TableHead>
						<TableHead className="border-b border-dark-miden-700">Slot value</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="border-b border-dark-miden-700 border-r"></TableCell>
						<TableCell className="border-b border-dark-miden-700 border-r"></TableCell>
						<TableCell className="border-b border-dark-miden-700"></TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	);
}
