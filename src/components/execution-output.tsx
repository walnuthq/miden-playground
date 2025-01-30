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
				className="h-[54px] bg-theme-surface-highlight
						flex flex-row items-center justify-between border-b-2 border-theme-border text-theme-text px-3"
			>
				Execution output
			</div>
			{executionOutput ? (
				<div className="overflow-hidden flex-1">
					<div className="bg-blue-miden text-theme-text px-2 py-1">Transaction info</div>
					<Table className="text-theme-text">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-theme-border border-r">Cycles</TableHead>
								<TableHead className="border-b border-theme-border">Trace length</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="border-b border-theme-border border-r">
									{executionOutput.totalCycles}
								</TableCell>
								<TableCell className="border-b border-theme-border">
									{executionOutput.traceLength}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
					<div className="bg-blue-miden text-theme-text px-2 py-1">Account info</div>
					<Table className="text-theme-text">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-theme-border border-r">Account ID</TableHead>
								<TableHead className="border-b border-theme-border border-r">
									Account Hash
								</TableHead>
								<TableHead className="border-b border-theme-border border-r">Type</TableHead>
								<TableHead className="border-b border-theme-border">Storage Mode</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="border-b border-theme-border border-r">
									{executionOutput.accountId.toString()}
								</TableCell>
								<TableCell className="border-b border-theme-border border-r">
									{executionOutput?.accountHash?.substring(0, 10)}
								</TableCell>
								<TableCell className="border-b border-theme-border border-r"></TableCell>
								<TableCell className="border-b border-theme-border"></TableCell>
							</TableRow>
						</TableBody>
					</Table>
					<Table className="text-theme-text">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-theme-border border-r">
									Code commitment
								</TableHead>
								<TableHead className="border-b border-theme-border border-r">Vault root</TableHead>
								<TableHead className="border-b border-theme-border border-r">
									Storage root
								</TableHead>
								<TableHead className="border-b border-theme-border">Nonce</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="border-b border-theme-border border-r">
									{executionOutput.codeCommitment?.substring(0, 10)}
								</TableCell>
								<TableCell className="border-b border-theme-border border-r">
									{executionOutput.vaultRoot?.substring(0, 10)}
								</TableCell>
								<TableCell className="border-b border-theme-border border-r">
									{executionOutput.storageCommitment?.substring(0, 10)}
								</TableCell>
								<TableCell className="border-b border-theme-border">
									{executionOutput.nonce?.toString().substring(0, 10)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
					<div className="bg-blue-miden text-theme-text px-2 py-1">Asset info</div>
					<Table className="text-theme-text">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-theme-border border-r">Asset Type</TableHead>
								<TableHead className="border-b border-theme-border border-r">Faucet ID</TableHead>
								<TableHead className="border-b border-theme-border">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{executionOutput.assets.map((asset) => (
								<TableRow key={asset.faucetId}>
									<TableCell className="border-b border-theme-border border-r">
										Fungible Asset
									</TableCell>
									<TableCell className="border-b border-theme-border border-r">
										{asset.faucetId.toString()}
									</TableCell>
									<TableCell className="border-b border-theme-border">{asset.amount}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<div className="bg-blue-miden text-theme-text px-2 py-1">Storage info</div>
					<Table className="text-theme-text">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-theme-border border-r">Slot index</TableHead>
								<TableHead className="border-b border-theme-border border-r">
									Previous value
								</TableHead>
								<TableHead className="border-b border-theme-border">New value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Object.entries(executionOutput.storageDiffs).map(([index, diff]) => (
								<TableRow key={index}>
									<TableCell className="border-b border-theme-border border-r">{index}</TableCell>
									<TableCell className="border-b border-theme-border border-r">
										{diff.old
											? '[' +
											  diff.old
													.map((item) => {
														// eslint-disable-next-line @typescript-eslint/no-explicit-any
														return item.toString() as any;
													})
													.join(', ') +
											  ']'
											: ''}
									</TableCell>
									<TableCell className="border-b border-theme-border">
										{diff.new
											? '[' +
											  diff.new
													.map((item) => {
														// eslint-disable-next-line @typescript-eslint/no-explicit-any
														return item.toString() as any;
													})
													.join(', ') +
											  ']'
											: ''}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<div className="bg-blue-miden text-theme-text px-2 py-1">Output notes</div>
					<Table className="text-theme-text">
						<TableHeader>
							<TableRow>
								<TableHead className="border-b border-theme-border border-r">ID</TableHead>
								<TableHead className="border-b border-theme-border border-r">Sender ID</TableHead>
								<TableHead className="border-b border-theme-border">Tag</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{executionOutput.outputNotes.map((note) => (
								<TableRow key={note.id}>
									<TableCell className="border-b border-theme-border border-r">
										{note.id.substring(0, 10)}
									</TableCell>
									<TableCell className="border-b border-theme-border border-r">
										{note.senderId}
									</TableCell>
									<TableCell className="border-b border-theme-border">{note.tag}</TableCell>
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
