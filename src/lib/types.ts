export interface ExecutionOutput {
	assets: Asset[];
	accountHash: string;
	codeCommitment: string;
	storageCommitment: string;
	vaultRoot: string;
	nonce: number;
	accountId: bigint;
	totalCycles: number;
	traceLength: number;
	storage: string[];
	outputNotes: { id: string; senderId: string; tag: string; assets: Asset[] }[];
}

export interface Asset {
	faucetId: bigint;
	amount: bigint;
}
