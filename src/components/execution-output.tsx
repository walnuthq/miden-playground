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

export function ExecutionOutput() {
	const { executionOutput } = useMiden();

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] bg-dark-miden-800
						flex flex-row items-center justify-between border-b-2 border-dark-miden-700 text-white px-3"
			>
				Execution output
			</div>
			{executionOutput ? (
				<div className="overflow-hidden flex-1">
					<div className="bg-blue-miden text-white px-2 py-1">Transaction info</div>
					<Table className="text-white">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-dark-miden-700 border-r">Cycles</TableHead>
								<TableHead className="border-b border-dark-miden-700">Trace length</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="border-b border-dark-miden-700 border-r">
									{executionOutput.totalCycles}
								</TableCell>
								<TableCell className="border-b border-dark-miden-700">
									{executionOutput.traceLength}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
					<div className="bg-blue-miden text-white px-2 py-1">Account info</div>
					<Table className="text-white">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-dark-miden-700 border-r">
									Account ID
								</TableHead>
								<TableHead className="border-b border-dark-miden-700 border-r">
									Account Hash
								</TableHead>
								<TableHead className="border-b border-dark-miden-700 border-r">Type</TableHead>
								<TableHead className="border-b border-dark-miden-700">Storage Mode</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="border-b border-dark-miden-700 border-r">
									{executionOutput.accountId.toString()}
								</TableCell>
								<TableCell className="border-b border-dark-miden-700 border-r">
									{executionOutput?.accountHash?.substring(0, 10)}
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
								<TableHead className="border-b border-dark-miden-700 border-r">
									Vault root
								</TableHead>
								<TableHead className="border-b border-dark-miden-700 border-r">
									Storage root
								</TableHead>
								<TableHead className="border-b border-dark-miden-700">Nonce</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="border-b border-dark-miden-700 border-r">
									{executionOutput.codeCommitment?.substring(0, 10)}
								</TableCell>
								<TableCell className="border-b border-dark-miden-700 border-r">
									{executionOutput.vaultRoot?.substring(0, 10)}
								</TableCell>
								<TableCell className="border-b border-dark-miden-700 border-r">
									{executionOutput.storageCommitment?.substring(0, 10)}
								</TableCell>
								<TableCell className="border-b border-dark-miden-700">
									{executionOutput.nonce?.toString().substring(0, 10)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
					<div className="bg-blue-miden text-white px-2 py-1">Asset info</div>
					<Table className="text-white">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-dark-miden-700 border-r">
									Asset Type
								</TableHead>
								<TableHead className="border-b border-dark-miden-700 border-r">Faucet ID</TableHead>
								<TableHead className="border-b border-dark-miden-700">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{executionOutput.assets.map((asset) => (
								<TableRow key={asset.faucetId}>
									<TableCell className="border-b border-dark-miden-700 border-r">
										Fungible Asset
									</TableCell>
									<TableCell className="border-b border-dark-miden-700 border-r">
										{asset.faucetId.toString()}
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
								<TableHead className="border-b border-dark-miden-700 border-r">
									Slot index
								</TableHead>
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
					<div className="bg-blue-miden text-white px-2 py-1">Output notes</div>
					<Table className="text-white">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-dark-miden-700 border-r">ID</TableHead>
								<TableHead className="border-b border-dark-miden-700 border-r">Sender ID</TableHead>
								<TableHead className="border-b border-dark-miden-700">Tag</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{executionOutput.outputNotes.map((note) => (
								<TableRow key={note.id}>
									<TableCell className="border-b border-dark-miden-700 border-r">
										{note.id.substring(0, 10)}
									</TableCell>
									<TableCell className="border-b border-dark-miden-700 border-r">
										{note.senderId}
									</TableCell>
									<TableCell className="border-b border-dark-miden-700">{note.tag}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : (
				<></>
			)}
		</div>
	);
}
