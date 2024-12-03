import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AccountState() {
	return (
		<div className="h-full border border-neutral-200 rounded-md p-2">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-44">Asset Type</TableHead>
						<TableHead className="w-40%">Faucet</TableHead>
						<TableHead className="">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="font-medium">Fungible Asset</TableCell>
						<TableCell>0x29b86f9443ad907a</TableCell>
						<TableCell className="">1000</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="font-medium">Fungible Asset</TableCell>
						<TableCell>0x5f3a2b1c4d6e7890</TableCell>
						<TableCell className="">500</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="font-medium">Fungible Asset</TableCell>
						<TableCell>0x1a2b3c4d5e6f7890</TableCell>
						<TableCell className="">100</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	)
}
